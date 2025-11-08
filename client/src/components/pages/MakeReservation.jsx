export function MakeReservation() {
  return (<>
      <form>
        <h2>Make a Reservation</h2>
        <label>
          Name:
          <input type="text" name="name" />
        </label>
        <br />
        {/* todo: make it so they can only make a reservation 6 months in advance */}
        <label>
          Start Date:
          <input type="date" name="startDate" />
        </label>
        <label>
          End Date:
          <input type="date" name="endDate" />
        </label>
        <br />
        <label>
          Time:
          <input type="time" name="time" />
        </label>
        <br />
        
        <label>
          RV size:
          <input type="number" name="rvSize" min="1" />
        </label>

        <label>
          Site Size:
          <input type="number" name="siteSize" min="1" />
        </label>
        <br />
        <button type="submit">Submit Reservation</button>
      </form>
      </>
  )
}