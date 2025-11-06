

export function MakeReservation() {
  return (
    <div>
      <h2>Make a Reservation</h2>
      <form>
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
        {/* TODO: make size responsive to RV size and disable if tent is selected */}
        {/* Different site type: RV Spaces:
            1-14 42’-43’ long (max RV length 40’)
            17-31 45’-46’ long (max RV length 43’)
            32-45 65’ long

            Tent/RV spaces
            1, 19, and 21
            Tent only spaces
            1 Avaialable.

            */}

        <label>
          Site Size:
          <input type="number" name="siteSize" min="1" />
        </label>
        <br />
        <button type="submit">Submit Reservation</button>
      </form>
    </div>
  )
}