import DrinkDetails from "./pages/DrinkDetails";

function App() {
  return (
    <div className="relative w-[800px] h-[480px] text-contrast border border-white overflow-hidden">
      <DrinkDetails
        name="Margarita"
        ingredients={[
          "50 ml rumu",
          "100 ml soku ananasowego",
          "20 ml syropu kokosowego",
          "Kostki lodu",
          "Plasterek ananasa do dekoracji",
        ]}
      />
    </div>
  );
}

export default App;
