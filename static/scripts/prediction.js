  //TODO: Fix end/terminus stations, being very funky with 20+ minutes not updating correctly
  //Extra: scrollable status updates -> switch word by word -> fix intervals, make current time always in est instead of using user time
  let intervalId = [null, null]; // Initialize intervalId outside of fetchTrainArrivals to keep track of the interval
  let prevStatus = [null, null];

  async function fetchTrainArrivals() {
    const lineElement = document.getElementById("line");
    const stationNameElement = document.getElementById("station-nameplate");
    stationNameElement.style.backgroundColor = getBackgroundColor();
    const stationId = document.getElementById("station-id").textContent;
    getCurrentTime();

    try {
      const data = await fetchTrainTimes(stationId);
      let count = 0;
      if (data.length === 0) {
        document.getElementById("headsign-0").textContent = "";
        document.getElementById("time-0").textContent = "";
        document.getElementById("headsign-1").textContent = "";
        document.getElementById("time-1").textContent = "";
      }
      for (let i = 0; i < data.length; i++) {
        const arrival = data[i];
        let status = arrival.attributes.status;
        const arrivalTime = arrival.attributes.arrival_time
          ? new Date(arrival.attributes.arrival_time)
          : null;
        const departureTime = arrival.attributes.departure_time
          ? new Date(arrival.attributes.departure_time)
          : null;

        //skip entry if there is no departure time
        if (!departureTime) continue;

        const currentTime = new Date();
        let secondsUntilArrival = arrivalTime
          ? (arrivalTime - currentTime) / 1000
          : departureTime
          ? (departureTime - currentTime) / 1000
          : 0;

        let secondsUntilDeparture = departureTime
          ? (departureTime - currentTime) / 1000
          : 0;

        let secondsUntil =
          secondsUntilDeparture !== null
            ? secondsUntilDeparture
            : secondsUntilArrival;

        //skip entry if time is less than 0 seconds away
        if (secondsUntil < 0) continue;
        const timeSpan = document.getElementById(`time-${count}`);

        //get headsign
        const tripId = arrival.relationships.trip.data.id;
        const headsignSpan = document.getElementById(`headsign-${count}`);
        const headsign = await fetchHeadsign(tripId);

        //if the train is signed for the current station, skip the entry
        if (headsign === document.getElementById("station-name").textContent)
          continue;

        const shorthandNames = {
          "Government Center": "Govt Ctr",
          "Park Street": "Park St",
          "Boston College": "Boston Col",
          "Cleveland Circle": "Clvlnd Cir",
          "North Station": "North Sta",
          "Forest Hills": "Frst Hills",
          "Union Square": "Union Sq",
          "Heath Street": "Heath St",
          "Medford/Tufts": "Medfrd/Tfts",
        };

        headsignSpan.textContent = shorthandNames[headsign] || headsign;

        if (headsign !== document.getElementById("station-name").textContent) {
          const vehicle = await fetchVehicleInfo(
            arrival.relationships.trip.data.id
          );
          if (!vehicle || vehicle.length === 0) {
            if (secondsUntilArrival <= 30) {
              timeSpan.textContent = `ARR`;
            } else if (secondsUntilArrival <= 60) {
              timeSpan.textContent = `1 min`;
            } else {
              const minutes = Math.ceil(secondsUntilArrival / 60);
              if (minutes > 20) {
                timeSpan.textContent = `20+ min`;
              } else {
                timeSpan.textContent = `${minutes} min`;
              }
            }
            return;
          }
          const vehicle_status = vehicle[0].attributes.current_status;
          const vehicle_stop = vehicle[0].relationships.stop.data.id;
          /*  if (status !== null) {
           const chunks = splitStringIntoChunks(status);

            let i = 0;
            // Clear any existing interval before setting a new one
            clearInterval(intervalId[count]); // Stop any existing interval
            let secondsElapsed = 0;
            intervalId[count] = setInterval(() => {
              timeSpan.textContent = chunks[i];
              i = (i + 1) % chunks.length;
              secondsElapsed += 2;
            }, 2000);
          } else */ if (
            secondsUntilArrival <= 90 &&
            vehicle_status === "STOPPED_AT" &&
            vehicle_stop === stationId
          ) {
            timeSpan.textContent = `BRD`;
          } else if (secondsUntilArrival <= 30) {
            timeSpan.textContent = `ARR`;
          } else if (secondsUntilArrival <= 60) {
            timeSpan.textContent = `1 min`;
          } else {
            const minutes = Math.ceil(secondsUntilArrival / 60);
            if (minutes > 20) {
              timeSpan.textContent = `20+ min`;
            } else {
              timeSpan.textContent = `${minutes} min`;
            }
          }
        }
        count++;
        if (i === data.length - 1 && count === 1) {
          document.getElementById(`headsign-${count}`).textContent = "";
          document.getElementById(`time-${count}`).textContent = "";
        }
        if (count === 2) break;
      }
    } catch (error) {
      console.error("Error fetching train arrivals:", error);
    }
  }
  
  function getBackgroundColor() {
    const line = document.getElementById("line").textContent;
    let backgroundColor = "default";

    switch (line) {
      case "Green Line":
        backgroundColor = "#2a8349";
        break;
      case "Red Line":
      case "Mattapan Trolley":
        backgroundColor = "#d6262a";
        break;
      case "Orange Line":
        backgroundColor = "#e88a32";
        break;
      case "Blue Line":
        backgroundColor = "#1f4d8e";
        break;
    }
    return backgroundColor;
  }

  function getCurrentTime() {
    //display current time to the right of the first arrival time
    const currTime = new Date();
    const currentTimeSpan = document.getElementById("current-time");
    let hours = currTime.getHours();
    let minutes = currTime.getMinutes();
    hours = hours % 12;
    hours = hours ? hours : 12;
    minutes = minutes < 10 ? "0" + minutes : minutes;
    let strTime = hours + ":" + minutes;
    currentTimeSpan.textContent = strTime;

    //second line placeholder for the current time to maintain alignment
    const placeholderSpan = document.getElementById("placeholder-time");
    placeholderSpan.textContent = "";
  }

  function splitStringIntoChunks(str) {
    const words = str.split(" ");
    const chunks = [];
    let currentChunk = "";

    for (let word of words) {
      if (currentChunk.length + word.length + 1 <= 9) {
        currentChunk += word + " ";
      } else {
        chunks.push(currentChunk.trim());
        currentChunk = word + " ";
      }
    }

    if (currentChunk) {
      chunks.push(currentChunk.trim());
    }

    return chunks;
  }

  async function fetchVehicleInfo(tripId) {
    try {
      const response = await fetch(`/api/get-vehicle?trip_id=${tripId}`);
      const vehicleData = await response.json();
      return vehicleData;
    } catch (error) {
      console.error("Error fetching vehicle info:", error);
      return null;
    }
  }

  async function fetchHeadsign(tripId) {
    try {
      const response = await fetch(`/api/get-headsign?trip_id=${tripId}`);
      const headsign = await response.json();
      return headsign;
    } catch (error) {
      console.error("Error fetching vehicle headsign:", error);
      return null;
    }
  }

  async function fetchTrainTimes(stationId) {
    try {
      const response = await fetch(
        `/api/train-arrivals?station_id=${stationId}`
      );
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error fetching train times: ", error);
      return null;
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    fetchTrainArrivals();
    setInterval(fetchTrainArrivals, 15000); //edit to change page refresh rate
  });