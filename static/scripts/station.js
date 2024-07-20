function goBack() {
    window.location.href = "/";
}

function populatePlatforms() {
    const lineSelect = document.getElementById("line");
    const platformSelect = document.getElementById("platform");
    const platformLabel = document.getElementById("platformLabel");
    const stationName = document.getElementById("station-name").textContent;
    const selectedLine = lineSelect.value;
    const mapRec = document.getElementById("map-rectangle");
    const lineColors = {
        "Green Line": "#2a8349",
        "Red Line": "#d6262a",
        "Mattapan Trolley": "#d6262a",
        "Orange Line": "#e88a32",
        "Blue Line": "#1f4d8e"
    };
    mapRec.style.backgroundColor = lineColors[selectedLine] || "black";

    platformSelect.innerHTML =
      '<option value="" selected disabled>Select a platform</option>';
    platformLabel.style.display = "initial";
    platformSelect.style.display = "flex";

    fetch(
      `/get_platforms?line=${encodeURIComponent(
        selectedLine
      )}&station_name=${encodeURIComponent(stationName)}`
    )
      .then((response) => response.json())
      .then((data) => {
        data.forEach((platform) => {
          if (
            platform.platform !== "Exit Only" &&
            platform.platform !== stationName
          ) {
            const option = document.createElement("option");
            option.value = platform.stop_id;
            option.id = platform.stop_id;
            option.className = "platform-option";
            option.textContent = getPlatformName(platform.platform, stationName)
            platformSelect.appendChild(option);
          }
        });
      });
}


function getPlatformName(platformName, stationName) {
    switch (platformName) {
        case "Orange Line":
            return (stationName === "Forest Hills") ? "Oak Grove" : "Forest Hills";
        case "Red Line":
            return (stationName === "Alewife") ? "Ashmont/Braintree" : "Alewife";
        case "Mattapan Trolley":
            return (stationName === "Ashmont") ? "Mattapan" : "Ashmont";
        case "Green Line":
            return (stationName === "Heath Street") ? "Park Street & North" : platformName;
        default:
            return platformName;
    }
}

function buttonAppear() {
    document.getElementById("submitButton").style.display = "flex";
}

function getPredictions() {
    const line = document.getElementById("line").value;
    const station_name = document.getElementById("station-name").textContent;
    const station_id = document.getElementById("platform").value;
    const platform = document.getElementById(`${station_id}`).textContent;

    if (station_name && station_id && line && platform) {
      window.open(
        `/prediction?station_name=${station_name}&line=${line}&platform=${encodeURIComponent(
          platform
        )}&station_id=${station_id}`,
        "_blank"
      );
    } else {
      console.error("Station name, ID, line, or platform is missing");
    }
}