struct PourCmd;

#include <Arduino.h>
#include <AccelStepper.h>
#include "HX711.h"
#include <math.h>

struct PourCmd {
  uint8_t slot;
  uint8_t ml;
};

// ================== LIMIT SWITCHES ==================
// NC wiring, pressed = HIGH (per user note)
#define X_LIMIT_PIN 4
#define Z_LIMIT_PIN 5

// ================== RELAYS ==================
// Jumpers HIGH => ACTIVE HIGH, OFF = LOW
#define RELAY_IN1 16
#define RELAY_IN2 17
#define RELAY_IN3 18
#define RELAY_IN4 19

// ================== DRV8825 ==================
// X
#define X_STEP 12
#define X_DIR  14
// Z
#define Z_STEP 32
#define Z_DIR  33

// ================== MICROSTEP (shared) ==================
#define MS0 25
#define MS1 26
#define MS2 27

// ================== HX711 ==================
#define HX_DT  23
#define HX_SCK 22
HX711 scale;

// ================== DIRECTION INVERSION ==================
static const bool INVERT_X = true;
static const bool INVERT_Z = true;

// ================== MECHANICS ==================
const float SCREW_PITCH_X = 4.0f; // mm/rev
const float SCREW_PITCH_Z = 2.0f; // mm/rev
const int motorSteps = 200;    // steps/rev

// ================== STARTUP / HOMING ==================
const unsigned long STARTUP_DELAY_MS = 10000; // set to 20000-30000 if needed
const unsigned long HOME_TIMEOUT_MS = 200000;

// Home direction: +1 or -1 (adjust to move toward the limit switch)
const int HOME_DIR_X = 1;
const int HOME_DIR_Z = 1;

const float HOME_SPEED_X = 800.0f;
const float HOME_SPEED_Z = 400.0f;

// ================== POUR POSITIONS (mm from home/0) ==================
// 1..10 (7-10 = 0)
const float pourPositions_mm[10] = {
  90.0f, 140.0f, 190.0f, 240.0f, 290.0f, 340.0f, 0.0f, 0.0f, 0.0f, 0.0f
};

// ================== DOSING ==================
const float Z_LIFT_MM = 35.0f;
const unsigned long Z_CYCLE_PAUSE_MS = 5000;
const float PUMP_FLOW_ML_PER_MIN = 2000.0f;

// ================== SCALE (HX711) ==================
// NOTE: Set SCALE_CALIBRATION to match your load cell calibration.
const float SCALE_CALIBRATION = -928.29f;
const uint8_t SCALE_SAMPLES = 10;
const unsigned long SCALE_SETTLE_MS = 800;
const float WEIGHT_TOLERANCE_G = 5.0f;
const uint8_t MAX_TOPUP_ATTEMPTS = 1;
const uint8_t TOPUP_MIN_ML = 1;

// ================== STEPPERS ==================
AccelStepper stepperX(AccelStepper::DRIVER, X_STEP, X_DIR);
AccelStepper stepperZ(AccelStepper::DRIVER, Z_STEP, Z_DIR);

// Position in mm (source of truth)
float posX_mm = 0.0f;
float posZ_mm = 0.0f;

// Microsteps (shared MS pins)
enum MicroMode { HALF = 2, QUARTER = 4 };
MicroMode currentMode = QUARTER;

float stepsPerMmX(MicroMode mode) {
  return (motorSteps * (int)mode) / SCREW_PITCH_X;
}

float stepsPerMmZ(MicroMode mode) {
  return (motorSteps * (int)mode) / SCREW_PITCH_Z;
}

long mmToStepsX(float mm, MicroMode mode) {
  return lround(mm * stepsPerMmX(mode));
}

long mmToStepsZ(float mm, MicroMode mode) {
  return lround(mm * stepsPerMmZ(mode));
}

static inline void relaysOffAll() {
  digitalWrite(RELAY_IN1, LOW);
  digitalWrite(RELAY_IN2, LOW);
  digitalWrite(RELAY_IN3, LOW);
  digitalWrite(RELAY_IN4, LOW);
}

static inline bool xHome() { return digitalRead(X_LIMIT_PIN) == HIGH; }
static inline bool zHome() { return digitalRead(Z_LIMIT_PIN) == HIGH; }

void waitStopAll() {
  stepperX.stop();
  stepperZ.stop();
  while (stepperX.isRunning() || stepperZ.isRunning()) {
    stepperX.run();
    stepperZ.run();
  }
}

static inline void runToStopAll() {
  while (stepperX.distanceToGo() != 0 || stepperZ.distanceToGo() != 0) {
    stepperX.run();
    stepperZ.run();
  }
}

// Set microstep (shared) and sync step counters to pos_mm
void setMicroMode(MicroMode mode) {
  if (mode == currentMode) return;

  waitStopAll();

  if (mode == HALF) {
    digitalWrite(MS0, HIGH);
    digitalWrite(MS1, LOW);
    digitalWrite(MS2, LOW);
  } else { // QUARTER
    digitalWrite(MS0, LOW);
    digitalWrite(MS1, HIGH);
    digitalWrite(MS2, LOW);
  }

  currentMode = mode;

  stepperX.setCurrentPosition(mmToStepsX(posX_mm, currentMode));
  stepperZ.setCurrentPosition(mmToStepsZ(posZ_mm, currentMode));
}

bool homeAxisZ() {
  setMicroMode(HALF);
  unsigned long t0 = millis();
  stepperZ.setSpeed(HOME_SPEED_Z * HOME_DIR_Z);
  while (!zHome()) {
    if (millis() - t0 > HOME_TIMEOUT_MS) return false;
    stepperZ.runSpeed();
  }
  stepperZ.setSpeed(0);
  posZ_mm = 0.0f;
  stepperZ.setCurrentPosition(mmToStepsZ(posZ_mm, currentMode));
  return true;
}

bool homeAxisX() {
  setMicroMode(QUARTER);
  unsigned long t0 = millis();
  stepperX.setSpeed(HOME_SPEED_X * HOME_DIR_X);
  while (!xHome()) {
    if (millis() - t0 > HOME_TIMEOUT_MS) return false;
    stepperX.runSpeed();
  }
  stepperX.setSpeed(0);
  posX_mm = 0.0f;
  stepperX.setCurrentPosition(mmToStepsX(posX_mm, currentMode));
  return true;
}

void moveXToPhysicalMm(float physical_mm) {
  setMicroMode(QUARTER);
  float target_mm = INVERT_X ? -physical_mm : physical_mm;
  posX_mm = target_mm;
  stepperX.moveTo(mmToStepsX(posX_mm, currentMode));
  runToStopAll();
}

void moveZRelativeMm(float physical_delta_mm) {
  setMicroMode(HALF);
  const bool movingDown = (physical_delta_mm < 0.0f);

  // If we're already at Z home and command asks to move further down, ignore it.
  if (movingDown && zHome()) {
    posZ_mm = 0.0f;
    stepperZ.setCurrentPosition(mmToStepsZ(posZ_mm, currentMode));
    return;
  }

  // Convert internal position to physical mm and clamp target down movement to home (0 mm).
  float currentPhysicalMm = INVERT_Z ? -posZ_mm : posZ_mm;
  float targetPhysicalMm = currentPhysicalMm + physical_delta_mm;
  if (movingDown && targetPhysicalMm < 0.0f) {
    targetPhysicalMm = 0.0f;
  }

  float targetInternalMm = INVERT_Z ? -targetPhysicalMm : targetPhysicalMm;
  stepperZ.moveTo(mmToStepsZ(targetInternalMm, currentMode));

  while (stepperZ.distanceToGo() != 0) {
    if (movingDown && zHome()) {
      // Hard stop: stop generating next pulses immediately.
      long cur = stepperZ.currentPosition();
      stepperZ.moveTo(cur);
      posZ_mm = 0.0f;
      stepperZ.setCurrentPosition(mmToStepsZ(posZ_mm, currentMode));
      return;
    }
    stepperZ.run();
  }

  posZ_mm = targetInternalMm;
}

void moveZToPhysicalMm(float physical_mm) {
  setMicroMode(HALF);
  float target_mm = INVERT_Z ? -physical_mm : physical_mm;
  posZ_mm = target_mm;
  stepperZ.moveTo(mmToStepsZ(posZ_mm, currentMode));
  runToStopAll();
}

unsigned long pumpDurationMs(uint8_t ml) {
  // 2000 ml/min => 30 ms per ml
  return (unsigned long)ml * 30UL;
}

void pumpRelay(uint8_t relayPin, uint8_t ml) {
  if (ml == 0) return;
  digitalWrite(relayPin, HIGH);
  delay(pumpDurationMs(ml));
  digitalWrite(relayPin, LOW);
}

static inline bool scaleReady() {
  return scale.is_ready();
}

static inline void tareScale() {
  if (!scaleReady()) return;
  scale.tare(SCALE_SAMPLES);
}

float readWeightGrams() {
  if (!scaleReady()) return NAN;
  return scale.get_units(SCALE_SAMPLES);
}

float checkPouredWeight(uint8_t expected_ml) {
  if (expected_ml == 0) return NAN;
  if (!scaleReady()) {
    Serial.println("HX711 not ready, skipping weight check.");
    return NAN;
  }

  delay(SCALE_SETTLE_MS);
  float grams = readWeightGrams();
  float expected_g = (float)expected_ml; // 1 ml ~= 1 g (water)
  float diff = fabsf(grams - expected_g);

  Serial.print("Weight check: expected=");
  Serial.print(expected_g, 1);
  Serial.print("g, measured=");
  Serial.print(grams, 1);
  Serial.print("g, diff=");
  Serial.print(diff, 1);
  Serial.println("g");

  if (diff <= WEIGHT_TOLERANCE_G) {
    Serial.println("Weight check OK.");
  } else {
    Serial.println("Weight check WARNING: out of tolerance.");
  }

  return grams;
}

void topUpIfNeeded(uint8_t slot, uint8_t expected_ml) {
  if (expected_ml == 0) return;
  if (!scaleReady()) return;

  for (uint8_t attempt = 0; attempt < MAX_TOPUP_ATTEMPTS; attempt++) {
    float grams = checkPouredWeight(expected_ml);
    if (isnan(grams)) return;

    float expected_g = (float)expected_ml;
    float deficit_g = expected_g - grams;
    if (deficit_g <= WEIGHT_TOLERANCE_G) return; // ok or overfilled

    uint8_t deficit_ml = (uint8_t)lroundf(deficit_g);
    if (deficit_ml < TOPUP_MIN_ML) return;

    Serial.print("Top-up: ");
    Serial.print(deficit_ml);
    Serial.println(" ml");

    switch (slot) {
      case 7: pumpRelay(RELAY_IN1, deficit_ml); break;
      case 8: pumpRelay(RELAY_IN2, deficit_ml); break;
      case 9: pumpRelay(RELAY_IN3, deficit_ml); break;
      case 10: pumpRelay(RELAY_IN4, deficit_ml); break;
      default: return;
    }
  }
}

void executeFrame(PourCmd* cmds, uint8_t count) {
  for (uint8_t i = 0; i < count; i++) {
    uint8_t slot = cmds[i].slot;
    uint8_t ml = cmds[i].ml;
    if (slot < 1 || slot > 10) continue;

    float xPos = pourPositions_mm[slot - 1];
    moveXToPhysicalMm(xPos);

    if (slot >= 1 && slot <= 6) {
      uint8_t cycles = (uint8_t)(ml / 35);
      for (uint8_t c = 0; c < cycles; c++) {
        moveZRelativeMm(Z_LIFT_MM);
        moveZRelativeMm(-Z_LIFT_MM);
        if (c + 1 < cycles) delay(Z_CYCLE_PAUSE_MS);
      }
    } else {
      moveZRelativeMm(20.0f);
      tareScale();
      switch (slot) {
        case 7: pumpRelay(RELAY_IN1, ml); break;
        case 8: pumpRelay(RELAY_IN2, ml); break;
        case 9: pumpRelay(RELAY_IN3, ml); break;
        case 10: pumpRelay(RELAY_IN4, ml); break;
        default: break;
      }
      topUpIfNeeded(slot, ml);
      moveZRelativeMm(-20.0f);
    }
  }

  // Return to position 0 after completing all commands
  moveZToPhysicalMm(0.0f);
  if (!homeAxisX()) {
    Serial.println("ERROR: X home timeout after pour.");
  }
}

void setup() {
  Serial.begin(115200);
  Serial.setTimeout(50);
  delay(100);

  // Limit switches
  pinMode(X_LIMIT_PIN, INPUT_PULLUP);
  pinMode(Z_LIMIT_PIN, INPUT_PULLUP);

  // Relays OFF
  pinMode(RELAY_IN1, OUTPUT);
  pinMode(RELAY_IN2, OUTPUT);
  pinMode(RELAY_IN3, OUTPUT);
  pinMode(RELAY_IN4, OUTPUT);
  relaysOffAll();

  // Microstep pins
  pinMode(MS0, OUTPUT);
  pinMode(MS1, OUTPUT);
  pinMode(MS2, OUTPUT);
  // start 1/4 (for X)
  digitalWrite(MS0, LOW);
  digitalWrite(MS1, HIGH);
  digitalWrite(MS2, LOW);
  currentMode = QUARTER;

  // Stepper config
  stepperX.setPinsInverted(false, false);
  stepperZ.setPinsInverted(false, false);

  stepperX.setMaxSpeed(2500);
  stepperX.setAcceleration(1200);
  stepperX.setMinPulseWidth(5);

  stepperZ.setMaxSpeed(800);
  stepperZ.setAcceleration(250);
  stepperZ.setMinPulseWidth(5);

  // HX711
  scale.begin(HX_DT, HX_SCK);
  scale.set_scale(SCALE_CALIBRATION);
  Serial.print("HX711 ready: ");
  Serial.println(scale.is_ready() ? "YES" : "NO");

  Serial.println("\nWaiting for Raspberry Pi...");
  delay(STARTUP_DELAY_MS);

  // Startup homing: check both switches (HIGH = home)
  if (!zHome() || !xHome()) {
    Serial.println("Not at home. Homing Z then X...");
    if (!homeAxisZ()) Serial.println("ERROR: Z home timeout.");
    if (!homeAxisX()) Serial.println("ERROR: X home timeout.");
  } else {
    Serial.println("Already at home (X=HIGH, Z=HIGH).");
  }

  posX_mm = 0.0f;
  posZ_mm = 0.0f;
  stepperX.setCurrentPosition(mmToStepsX(posX_mm, currentMode));
  stepperZ.setCurrentPosition(mmToStepsZ(posZ_mm, currentMode));

  Serial.println("\n=== X/Z move: X=1/4, Z=1/2 (shared MS, sequential move) ===");
  Serial.println("Waiting for UART frame...");
}

void loop() {
  static PourCmd cmds[10]; 
  static uint8_t cmdCount = 0;
  static bool prevWasSep = false;
  static uint8_t state = 0; // 0=WAIT_SLOT, 1=WAIT_ML, 2=WAIT_SEP
  static uint8_t curSlot = 0;
  static uint8_t curMl = 0;

  while (Serial.available() > 0) {
    uint8_t b = (uint8_t)Serial.read();

    if (state == 0) { // WAIT_SLOT
      if (prevWasSep && b == 0xFF) {
        // End of frame (double 0xFF)
        Serial.println("received");
        executeFrame(cmds, cmdCount);
        Serial.println("Done");

        // Reset parser
        cmdCount = 0;
        prevWasSep = false;
        state = 0;
        curSlot = 0;
        curMl = 0;
        continue;
      }

      prevWasSep = false;

      if (b >= 1 && b <= 10) {
        curSlot = b;
        state = 1;
      }
      continue;
    }

    if (state == 1) { // WAIT_ML
      curMl = b;
      state = 2;
      continue;
    }

    if (state == 2) { // WAIT_SEP
      if (b == 0xFF) {
        if (cmdCount < 10) {
          cmds[cmdCount].slot = curSlot;
          cmds[cmdCount].ml = curMl;
          cmdCount++;
        }
        prevWasSep = true;
        state = 0;
      } else {
        // invalid separator -> reset
        cmdCount = 0;
        prevWasSep = false;
        state = 0;
      }
      continue;
    }
  }
}
