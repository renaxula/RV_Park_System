export function ChangeRates() {
  return (
    <div>
      <h2>Change Rates</h2>
      <p>Update nightly rates for each site type.</p>
      <form>
        <label>
          RV Small (1-14):
          <input type="number" name="rateSmall" step="0.01" />
        </label>
        <br />
        <label>
          RV Medium (17-31):
          <input type="number" name="rateMedium" step="0.01" />
        </label>
        <br />
        <label>
          RV Large (32-45):
          <input type="number" name="rateLarge" step="0.01" />
        </label>
        <br />
        <button type="submit">Save Rates</button>
      </form>
    </div>
  );
}
