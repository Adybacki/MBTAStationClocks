
//search delay to prevent api calls on every keystroke
let searchTimeout;
function searchDelay() {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(searchStation, 500);
}

//search for stations that match the query
function searchStation() {
  const input = document.getElementById("searchInput").value.toLowerCase();
  const resultsList = document.getElementById("searchResults");
  resultsList.innerHTML = "";

  if (input.length > 0) {
    fetch(`/search?query=${input}`)
      .then((response) => response.json())
      .then((data) => {
        if (data.length === 0) {
          resultsList.appendChild(createListItem("No results found"));
        } else {
          data.forEach((station) => resultsList.appendChild(createListItem(station))
          );
        }
      });
  }
}

function createListItem(text) {
  const listItem = document.createElement("li");
  listItem.textContent = text;
  return listItem;
}

document.addEventListener("DOMContentLoaded", function() {
  const searchInput = document.getElementById("searchInput");
  if (searchInput) {
    searchInput.addEventListener("input", searchDelay);
  }
});

document.getElementById("searchResults").addEventListener("click", function (event) {
  if (
    event.target.tagName === "LI" &&
    event.target.textContent !== "No results found"
  ) {
    const stationName = event.target.textContent;
    window.location.href = `/station?name=${encodeURIComponent(
      stationName
    )}`;
  }
});

