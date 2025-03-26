
let chartInstances = {};

// New data structure to store selected villages across district changes
let persistentSelections = {
  villages: {}, // Format: {villageId: {name, population, districtName, subdistrictName, stateCode, districtCode, subdistrictCode}}
  totalPopulation: 0
};



let count=0;
document.addEventListener("DOMContentLoaded", function () {
  const stateDropdown = document.getElementById("state");
  const districtList = document.getElementById("district-list");
  const subdistrictList = document.getElementById("subdistrict-list");
  const townVillageContainer = document.getElementById("town-village-container");
  const selectedVillagesContainer = document.getElementById("selected-villages");
  const totalPopulationContainer = document.getElementById("total-population");

  let selectedDistricts = new Set();
  let selectedSubdistricts = new Set();
  let selectedVillages = new Set();
  let districtNames = {}; // Store district names for subdistrict grouping
  let subdistrictNames = {}; // Store subdistrict names with code for each district 
  let code_to_villagename = {};
  let code_to_villagepopulation_2011= {} 
  let code_to_villagefloating_pop = {};
  let villageToDistrict = {}; // {villageCode: districtCode}
  let villageToSubdistrict = {}; // {villageCode: subdistrictCode}


  // Fetch states on page load
  fetch("/population/get-states/")
      .then(response => response.json())
      .then(states => populateDropdown(stateDropdown, states, "state_code", "region_name"))
      .catch(error => console.error("Error fetching states:", error));

  // Fetch districts when a state is selected
  stateDropdown.addEventListener("change", function () {
      const stateCode = this.value;
      selectedDistricts.clear();
      districtList.innerHTML = "";
      if(subdistrictList.innerHTML !== ""){
        subdistrictList.innerHTML = ""; // Reset subdistrict list
      }
      if(townVillageContainer.innerHTML !== ""){
        townVillageContainer.innerHTML = ""; // Reset villages
      }
          // ✅ Clear persistentSelections when state changes
      persistentSelections = {
            villages: {}, // Reset villages
            totalPopulation: 0
        };


      if (stateCode) {
          fetch(`/population/get-districts/${stateCode}/`)
              .then(response => response.json())
              .then(districts => {
                  districts.forEach(d => districtNames[d.district_code] = d.region_name);
                  populateCheckboxList(districtList, districts, "district_code", "region_name", selectedDistricts, fetchSubdistricts);
              })
              .catch(error => console.error("Error fetching districts:", error));
          
      }
  });

  // Fetch subdistricts when districts are selected
  function fetchSubdistricts() {
      const stateCode = stateDropdown.value;
      selectedSubdistricts.clear();
      if(subdistrictList.innerHTML !== ""){
        subdistrictList.innerHTML = ""; // Clear subdistricts before repopulating
      }
          // ✅ Clear previously selected villages since subdistricts are changing
    persistentSelections.villages = {};
    persistentSelections.totalPopulation = 0;
    townVillageContainer.innerHTML = ""; // Also reset the displayed villages

      if (selectedDistricts.size > 0) {
          selectedDistricts.forEach(districtCode => {
              fetch(`/population/get-subdistricts/${stateCode}/${districtCode}/`)
                  .then(response => response.json())
                  .then(subdistricts => {
                    // console.log("sd",subdistricts);
                    subdistricts.forEach(d => subdistrictNames[d.subdistrict_code] =d.region_name);
                      if (subdistricts.length > 0) {
                          let districtName = districtNames[districtCode];
                          let header = document.createElement("div");
                          header.classList.add("fw-bold", "mt-2", "border-bottom", "pb-1");
                          header.textContent = districtName;
                          subdistrictList.appendChild(header);
                      }

                      populateCheckboxList(subdistrictList, subdistricts, "subdistrict_code", "region_name", selectedSubdistricts, fetchVillages, districtCode);
                           
                  })
                  .catch(error => console.error("Error fetching subdistricts:", error));
          });
         
          
      }
  }

  // Handle subdistrict selection (store district-subdistrict pair)
  subdistrictList.addEventListener("change", function (event) {
      if (event.target.classList.contains("subdistrict-checkbox")) {
          const districtCode = event.target.getAttribute("data-district");
          const subdistrictCode = event.target.value;
          const combinedCode = `${districtCode}-${subdistrictCode}`;

          if (event.target.checked) {
              selectedSubdistricts.add(combinedCode);
          } else {
              selectedSubdistricts.delete(combinedCode);
          }

          console.log("Updated Selected Subdistricts:", Array.from(selectedSubdistricts));
          fetchVillages();
      }
  });

  
function fetchVillages() {
  
  const stateCode = document.getElementById("state").value;
  selectedVillages.clear();

  let villageFetchPromises = [];

  selectedSubdistricts.forEach(combinedCode => {
      if (!combinedCode.includes("-")) {
          console.error(`Invalid subdistrictCode format: ${combinedCode}`);
          return;
      }

      let [districtCode, subCode] = combinedCode.split("-");

      let fetchPromise = fetch(`/population/get-villages/${stateCode}/${districtCode}/${subCode}/`)
          .then(response => {
              if (!response.ok) {
                  throw new Error(`HTTP error! Status: ${response.status}`);
              }
              return response.json();
          })
          .then(villages => {
            // console.log("villages fetchvillg,",villages);
            villages.forEach(village => {
                villageToDistrict[village.village_code] = districtCode;
                villageToSubdistrict[village.village_code] = subCode;
            });
            
            villages.forEach(d => {
              code_to_villagename[d.village_code] = d.region_name;
              code_to_villagepopulation_2011[d.village_code] = d.population_2011;
              code_to_villagefloating_pop[d.village_code] = d.floating_pop;
            });
          
              const subdistrictPopulationSum = villages
                  .filter(item => item.region_name.startsWith("Subdistrict"))
                  .reduce((sum, item) => sum + (item.population_2011 || 0), 0);

              const filteredVillages = villages.filter(item => item.village_code !== 0);
              filteredVillages.sort((a, b) => (a.region_name || '').localeCompare(b.region_name || ''));

              const allEntry = villages.find(item => item.village_code === 0 && item.region_name.trim() === "All");
              if (allEntry && allEntry.population_2011 === null) {
                  allEntry.population_2011 = subdistrictPopulationSum;
              }
              if (allEntry) {
                  filteredVillages.unshift(allEntry);
              }

              return { subdistrictCode: combinedCode, villages: filteredVillages };
          });

      villageFetchPromises.push(fetchPromise);
  });

  Promise.all(villageFetchPromises)
      .then(results => {
          townVillageContainer.innerHTML = ""; // Clear previous content

          // Create a horizontally scrollable container
          let scrollContainer = document.createElement("div");
          scrollContainer.classList.add("scrollable-container"); // Add class for styling
          // console.log("resultg ",results);
          
          results.forEach(({ subdistrictCode, villages }) => {
              let [districtCode, subCode] = subdistrictCode.split("-");

              // Create a column for each subdistrict
              let colDiv = document.createElement("div");
              colDiv.classList.add("village-column");

              let header = document.createElement("div");
              header.classList.add("fw-bold", "border-bottom", "pb-1", "mb-2", "village-header"); // Add CSS class
              
              // Ensure long names don't overflow
              let districtName = districtNames[districtCode] || `District ${districtCode}`;
              let subdistrictName = subdistrictNames[subCode] || `Subdistrict ${subCode}`;
              
              header.textContent = `${districtName} - ${subdistrictName}`;
              header.title = `${districtName} - ${subdistrictName}`; // Tooltip on hover to show full name
              colDiv.appendChild(header);
              
              // console.log("villages ", villages);
              
              populateCheckboxList(colDiv, villages, "village_code", "region_name", selectedVillages, updateSelectedVillages);

              scrollContainer.appendChild(colDiv); // Append column to scrollable container
          });

          townVillageContainer.appendChild(scrollContainer); // Append scrollable container
      })
      .catch(error => console.error("Error fetching villages:", error));
}





  // Populate standard dropdown
  function populateDropdown(dropdown, data, valueField, textField) {
      dropdown.innerHTML = '<option value="">Select an Option</option>';
      data.forEach(item => {
          let option = document.createElement("option");
          option.value = item[valueField];
          option.textContent = item[textField];
          dropdown.appendChild(option);
      });
  }
 
  function populateCheckboxList(container, data, valueField, textField, selectedSet, callback = null, districtCode = null) {
    data.forEach(item => {
        let listItem = document.createElement("div");
        listItem.classList.add("form-check");

        let checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.value = item[valueField];
        checkbox.id = `${valueField}-${item[valueField]}`;
        checkbox.classList.add("form-check-input");

        if (districtCode) {
            checkbox.classList.add("subdistrict-checkbox");
            checkbox.setAttribute("data-district", districtCode);
        }

        let label = document.createElement("label");
        label.htmlFor = checkbox.id;
        label.classList.add("form-check-label");
        label.textContent = item[textField];

        checkbox.addEventListener("change", function () {
            let formattedCode = districtCode ? `${districtCode}-${this.value}` : this.value;

            if (this.checked) {
                selectedSet.add(formattedCode);
            } else {
                selectedSet.delete(formattedCode);
            }

            if (callback) callback();
            updateSelectedVillages(); // Ensure persistentSelections updates on checkbox change
        });

        listItem.appendChild(checkbox);
        listItem.appendChild(label);
        container.appendChild(listItem);
    });

    if (callback) callback();
}



  // Update selected villages display
  function updateSelectedVillages() {
    console.log("updateSelectedVillages called");
    selectedVillagesContainer.innerHTML = ""; // Clear previous selections
    let totalPopulation = 0;
    let totalFloatingPopulation = 0;

    persistentSelections.villages = {}; // Reset persistentSelections
    persistentSelections.totalPopulation = 0;

    // Create a table for better formatting
    let table = document.createElement("table");
    table.classList.add("table", "table-bordered", "mt-2");

    // Create table header
    let thead = document.createElement("thead");
    let headerRow = document.createElement("tr");

    let villageHeader = document.createElement("th");
    villageHeader.textContent = "Village Name";

    let populationHeader = document.createElement("th");
    populationHeader.textContent = "Population (2011)";

    headerRow.appendChild(villageHeader);
    headerRow.appendChild(populationHeader);
    thead.appendChild(headerRow);
    table.appendChild(thead);

    // Table body
    let tbody = document.createElement("tbody");

    selectedVillages.forEach(villageCode => { 
        let villageName = code_to_villagename[villageCode] || `Village ${villageCode}`;
        let villagePopulation = parseInt(code_to_villagepopulation_2011[villageCode] || "0", 10);

        // NEW: Get floating population for this village
        let villageFloating = parseInt(code_to_villagefloating_pop[villageCode] || "0", 10);

        // Retrieve district and subdistrict details
        let districtCode = villageToDistrict[villageCode] || "";
        let subdistrictCode = villageToSubdistrict[villageCode] || "";
        let districtName = districtNames[districtCode] || `District ${districtCode}`;
        let subdistrictName = subdistrictNames[subdistrictCode] || `Subdistrict ${subdistrictCode}`;
        let stateCode = stateDropdown.value; // Current selected state

        // Store village details in persistentSelections
        persistentSelections.villages[villageCode] = {
            name: villageName,
            population: villagePopulation,
            districtName: districtName,
            subdistrictName: subdistrictName,
            stateCode: stateCode,
            districtCode: districtCode,
            subdistrictCode: subdistrictCode
        };

        // Create row for village data
        let row = document.createElement("tr");

        let villageCell = document.createElement("td");
        villageCell.textContent = villageName;

        let populationCell = document.createElement("td");
        populationCell.textContent = villagePopulation;

        row.appendChild(villageCell);
        row.appendChild(populationCell);
        tbody.appendChild(row);

        totalPopulation += villagePopulation;
        totalFloatingPopulation += villageFloating; // NEW addition
    });

    table.appendChild(tbody);
    selectedVillagesContainer.appendChild(table);

    // Display total population at the bottom
    let totalPopulationElement = document.createElement("div");
    totalPopulationElement.classList.add("fw-bold", "mt-2");
    totalPopulationElement.textContent = `Total Population: ${totalPopulation}`;
    
    selectedVillagesContainer.appendChild(totalPopulationElement);

    // Update persistentSelections total population
    persistentSelections.totalPopulation = totalPopulation;

    // NEW: Auto-populate the Floating Population (2011) field with the summed value
    console.log('Total floating population:', totalFloatingPopulation);
    let floatingField = document.getElementById("floating_field");
    if (floatingField) {
        floatingField.value = totalFloatingPopulation;
    }
}






});









//   ----------------------calculate and show dynamic table----------------------------

document.addEventListener('DOMContentLoaded', () => {
  const singleYearOption = document.getElementById('single-year-option');
  const rangeYearOption = document.getElementById('range-year-option');
  const targetYearInput = document.getElementById('target-year');
  const targetYearRangeStart = document.getElementById('target-year-range-start');
  const targetYearRangeEnd = document.getElementById('target-year-range-end');
  const calculateBtn = document.getElementById('clc');

  const toggleButton = document.getElementById('toggle-view');
  const resultsContainer = document.getElementById('results-container');
  const chartContainer = document.getElementById('chart-container');
  let summedChart = null;  // Store chart instance

  // Handle year selection options
  singleYearOption.addEventListener('change', () => {
      targetYearInput.disabled = false;
      targetYearRangeStart.disabled = true;
      targetYearRangeEnd.disabled = true;
  });

  rangeYearOption.addEventListener('change', () => {
      targetYearInput.disabled = true;
      targetYearRangeStart.disabled = false;
      targetYearRangeEnd.disabled = false;
  });

  calculateBtn.addEventListener('click', async function (e) {
      console.log("Calculate button clicked");
      e.preventDefault();

      let targetYear = targetYearInput.value.trim();
      let start = targetYearRangeStart.value.trim();
      let end = targetYearRangeEnd.value.trim();
      const targetYearError = document.getElementById('target-year-error');
      const targetYearRangeError = document.getElementById('target-year-range-error');

      // Clear previous error messages
      targetYearError.textContent = '';
      targetYearRangeError.textContent = '';

      // Validate target year (single selection)
      if (singleYearOption.checked) {
          if (!targetYear || isNaN(targetYear) || targetYear < 2012 || targetYear > 2100) {
              alert("Please enter a valid year between 2012 and 2100.");
              targetYearError.textContent = "Year must be between 2012 and 2100.";
              return;
          }
      }

      // Validate year range (range selection)
      if (rangeYearOption.checked) {
          if (!start || !end || isNaN(start) || isNaN(end) || start < 2012 || end > 2100 || end <= start) {
              alert("End year must be greater than the start year and both must be between 2012 and 2100.");
              targetYearRangeError.textContent = "Invalid range.";
              return;
          }
      }

      const state = document.getElementById('state').value;
      const district = document.getElementById('district-btn').value;
      const subdistrict = document.getElementById('subdistrict-btn').value;

      let timeSeries = document.getElementById('time-series');
      let demographic = document.getElementById('demographic-based');
      let cohort = document.getElementById('cohort-component');
    
      if(timeSeries.checked || demographic.checked && !cohort.checked ){
        let summedList = {};
        if (timeSeries.checked) {
          let selectedMethods = [];
          let methods = [
              "arithmetic-increase",
              "geometric-increase",
          
              "exponential-growth",
              "incremental-growth"
          ];

          methods.forEach(method => {
              let checkbox = document.getElementById(method);
              if (checkbox && checkbox.checked) {
                  selectedMethods.push(checkbox.value);
              }
          });

          async function processMethods() {
              let list = [];
              await Promise.all(selectedMethods.map(m => handleProjection(m, list)));
              console.log("Updated list:", JSON.stringify(list, null, 2));

             

              // Check if list has data
              if (list.length === 0) {
                  console.error("Error: list is empty!");
                  return;
              }
          
              list.forEach((methodData, index) => {
                  console.log(`Processing method ${index}:`, methodData);
          
                  let outerMethodName = Object.keys(methodData)[0]; // Extract top-level method key
                  let innerData = methodData[outerMethodName];  // Get the next-level object
                  let methodName = Object.keys(innerData)[0]; // Extract the actual method name
                  let villageData = innerData[methodName]; // Extract village population data
          
                  if (!summedList[methodName]) {
                      summedList[methodName] = {};
                  }
          
                  for (let villageId in villageData) {
                      let yearData = villageData[villageId];
          
                      for (let year in yearData) {
                   
                          let population = Number(yearData[year]); // Ensure numerical addition
                          if (!isNaN(population)) {
                              summedList[methodName][year] = (summedList[methodName][year] || 0) + population;
                          } else {
                              console.warn(`Skipping invalid population data for ${methodName}, Year: ${year}`);
                          }
                      }
                  }
              });
          
             

              return summedList;
          }
          await processMethods();


        }
        if(demographic.checked){
          const birthRate = document.getElementById("birth-rate").value;
          const deathRate = document.getElementById("death-rate").value;
          const emigrationRate = document.getElementById("emigration-rate").value;
          const immigrationRate = document.getElementById("immigration-rate").value;

          // Check if any field is empty
          if (!birthRate || !deathRate || !emigrationRate || !immigrationRate) {
            alert("Please fill in all rate fields before continuing.");
            return; // Exit the function
          }
          await calculateDemographic(summedList);
        }
        
        console.log("Summed List:", JSON.stringify(summedList, null, 2));

        window.summedList = summedList; // Now it is available globally

        renderTable(summedList);
        displayTable(summedList);
        displayGrowthTable(summedList)

        // Ensure the button appears only after the table is displayed
        toggleButton.style.display = 'block';

        // Toggle Button Functionality (Only for Graph)
        toggleButton.addEventListener('click', function (e) {
            e.preventDefault();
            
            if (chartContainer.style.display === 'none') {
                chartContainer.style.display = 'block';
                toggleButton.textContent = 'Update graph';
                displayLineGraph(summedList);  // Generate Chart
            } else {
                chartContainer.style.display = 'none';
                toggleButton.textContent = 'Update graph';
            }
        });

      }

       
      else if (cohort.checked ) {
          alert("Work is in progress!");
          return;
      }
  });

// ----------------------------------------------------------- demographic calculationStart----------------------------------

// Async function to handle demographic calculations
async function calculateDemographic(summedList) {
  const state = document.getElementById('state').value;
  const district = document.getElementById('district-btn').value;
  const subdistrict = document.getElementById('subdistrict-btn').value;
      
  const singleYearOption = document.getElementById('single-year-option');
  const rangeYearOption = document.getElementById('range-year-option');
  const targetYearInput = document.getElementById('target-year');
  const targetYearRangeStart = document.getElementById('target-year-range-start');
  const targetYearRangeEnd = document.getElementById('target-year-range-end');
  const birthRate = document.getElementById("birth-rate").value;
  const deathRate = document.getElementById("death-rate").value;
  const emigrationRate = document.getElementById("emigration-rate").value;
  const immigrationRate = document.getElementById("immigration-rate").value;
  const selectedVillages = Array.from(
    document.querySelectorAll('#town-village-container input[type="checkbox"]:checked')
  ).map(village => village.id);
  const baseYear = document.getElementById('base-year').value;
  const yearSelection = document.querySelector('input[name="year_selection"]:checked')?.value;
  let targetYear = null;
  let targetYearRange = null;

  // Handle year selection options
  singleYearOption.addEventListener('change', () => {
    targetYearInput.disabled = false;
    targetYearRangeStart.disabled = true;
    targetYearRangeEnd.disabled = true;
  });
  rangeYearOption.addEventListener('change', () => {
    targetYearInput.disabled = true;
    targetYearRangeStart.disabled = false;
    targetYearRangeEnd.disabled = false;
  });
  
  if (yearSelection === 'single') {
    targetYear = targetYearInput.value;
  } else if (yearSelection === 'range') {
    targetYearRange = {
      start: targetYearRangeStart.value,
      end: targetYearRangeEnd.value,
    };
  }
  console.log("Birth rate = ", birthRate);
  console.log("Death rate = ", deathRate);
  console.log("emigration rate = ", emigrationRate);
  console.log("immigration rate = ", immigrationRate);
  
  // Validate inputs
  if (!state || selectedVillages.length === 0 || !birthRate || !deathRate || !emigrationRate || !immigrationRate ||
    (!targetYear && (!targetYearRange || !targetYearRange.start || !targetYearRange.end))) {
    alert('Please fill out all required fields.');
    return;
  }
  const persistentSelection = persistentSelections.villages
  console.log("psD, ",persistentSelection);
  
  
  const requestData = {
    state,
    district,
    subdistrict,
    villages: selectedVillages,
    persistentSelection,
    baseYear,
    targetYear,
    targetYearRange,
    birthRate,
    deathRate,
    emigrationRate,
    immigrationRate,
  };
  
  try {
    const response = await fetch("/population/calculate-demographic/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestData),
    });
    
    const data = await response.json();
    
    if (data.success && data.result) {
      console.log("result demographic = ", data.result);
      // Handle the result data here

      let fetchedData = data.result;

      if (!summedList["demographic-calculation"]) {
          summedList["demographic-calculation"] = {};
      }
      
      Object.values(fetchedData["demographic-attribute"]).forEach(entry => {
          Object.entries(entry).forEach(([year, value]) => {
              summedList["demographic-calculation"][year] = 
                  (summedList["demographic-calculation"][year] || 0) + value;
          });
      });
      
      console.log("Updated Summed List with Demographic Calculation:", JSON.stringify(summedList, null, 2));
      
      
    
    } else {
      console.error("Calculation failed:", data.error || "Unknown error");
      alert("Failed to calculate demographic data. Please try again.");
    }
  } catch (error) {
    console.error("Error calculating demographic data:", error);
    alert("An error occurred while calculating demographic data. Please try again.");
  }
}
// -----------------------------------------------------------  demographic calculationEnd-----------------------------------
   


// Function to render the table and then show the toggle button
function renderTable(summedList) {
  console.log("andar renderGraph");
  
  let tableHTML = '<table class="table table-bordered"><thead><tr><th>Year</th>';

  // Extract method names
  let methods = Object.keys(summedList);
  methods.forEach(method => {
      tableHTML += `<th>${method}</th>`;
  });

  tableHTML += '</tr></thead><tbody>';

  // Extract all years (sorted)
  let allYears = new Set();
  Object.values(summedList).forEach(yearData => {
      Object.keys(yearData).forEach(year => allYears.add(year));
  });
  const sortedYears = [...allYears].sort((a, b) => a - b);

  // Populate table rows
  sortedYears.forEach(year => {
      tableHTML += `<tr><td>${year}</td>`;
      methods.forEach(method => {
          tableHTML += `<td>${summedList[method][year] || 0}</td>`;
      });
      tableHTML += '</tr>';
  });

  tableHTML += '</tbody></table>';
  resultsContainer.innerHTML = tableHTML;

  // Show the toggle button after table is displayed
  toggleButton.style.display = 'block';
}

function displayLineGraph(summedList) {
  console.log("andar display LineGraph");

  const ctx = document.getElementById('summedChart').getContext('2d');

 // Predefined dark colors for lines
const fixedColors = [
  'rgb(128, 0, 0)',      // Dark Red
  'rgb(0, 247, 247)',     
  'rgb(75, 0, 130)',     // Indigo
  'rgb(0, 100, 0)',      // Dark Green
  'rgb(255, 140, 0)'     // Dark Orange
];

  // Extract years (sorted)
  let allYears = new Set();
  Object.values(summedList).forEach(yearData => {
      Object.keys(yearData).forEach(year => allYears.add(year));
  });
  const sortedYears = [...allYears].sort((a, b) => a - b);

  // Extract Data for Each Method
  let datasets = Object.entries(summedList).map(([method, yearData], index) => ({
      label: method,
      data: sortedYears.map(year => yearData[year] || 0), // Ensure 0 if data missing
      borderColor: fixedColors[index % fixedColors.length],  // Assign fixed colors
      backgroundColor: 'transparent', // Transparent fill
      borderWidth: 2,
      tension: 0.1  // Optional: slight curve to lines
  }));

  // Destroy previous chart if exists
  if (summedChart) summedChart.destroy();

  // Create new chart
  summedChart = new Chart(ctx, {
      type: 'line',
      data: {
          labels: sortedYears,
          datasets: datasets
      },
      options: {
          responsive: true,
          plugins: {
              legend: { position: 'top' },
              title: { display: true, text: 'Population Projection Line Graph' }
          },
          scales: {
              y: { 
                  beginAtZero: false  // Adjust based on data
              }
          }
      }
  });
}




function displayTable(summedList) {
  console.log("Displaying table");

  const resultsSection = document.getElementById('results-section');
  const resultsContainer = document.getElementById('results-container');

  // Clear previous results
  resultsContainer.innerHTML = '';

  if (Object.keys(summedList).length === 0) {
      resultsContainer.innerHTML = "<p>No data available.</p>";
      return;
  }

  // Create a responsive table container
  const tableContainer = document.createElement('div');
  tableContainer.className = 'table-responsive';
  tableContainer.style.maxWidth = '100%';
  tableContainer.style.overflowX = 'auto';

  // Create table
  const table = document.createElement('table');
  table.className = 'table table-bordered table-hover';

  // Extract all unique years
  let allYears = new Set();
  Object.values(summedList).forEach(yearData => {
      Object.keys(yearData).forEach(year => allYears.add(year));
  });

  // Sort years in ascending order
  const sortedYears = [...allYears].sort((a, b) => a - b);

  // Create table header
  const thead = document.createElement('thead');
  const headerRow = document.createElement('tr');
  headerRow.className = 'bg-light';

  // Add first column for method names
  const methodHeader = document.createElement('th');
  methodHeader.textContent = 'Projection Method';
  methodHeader.style.position = 'sticky';
  methodHeader.style.left = '0';
  methodHeader.style.backgroundColor = '#f8f9fa';
  methodHeader.style.zIndex = '1';
  headerRow.appendChild(methodHeader);

  // Add year columns
  sortedYears.forEach(year => {
      const yearHeader = document.createElement('th');
      yearHeader.textContent = year;
      headerRow.appendChild(yearHeader);
  });

  thead.appendChild(headerRow);
  table.appendChild(thead);

  // Create table body
  const tbody = document.createElement('tbody');
  let highestMethod = null;
  let highestValue = -Infinity;

  // Add rows for each projection method
  Object.entries(summedList).forEach(([method, yearData]) => {
      const row = document.createElement('tr');

      // Calculate the sum of values for the method
      const currentSum = Object.values(yearData).reduce((sum, val) => sum + val, 0);

      // Add method name and radio button in the same column
      const methodCell = document.createElement('td');
      methodCell.className = 'fw-bold';
      methodCell.style.position = 'sticky';
      methodCell.style.left = '0';
      methodCell.style.backgroundColor = '#ffffff';
      methodCell.style.zIndex = '1';

      // Radio button
      const radioButton = document.createElement('input');
      radioButton.type = 'radio';
      radioButton.name = 'projection-method';
      radioButton.value = method;
      radioButton.id = `radio-${method}`;
      radioButton.style.marginRight = '8px';

      // Auto-select the highest value method
      if (currentSum > highestValue) {
          highestValue = currentSum;
          highestMethod = radioButton;
      }

      methodCell.appendChild(radioButton);

      // Method name after the radio button
      const methodLabel = document.createElement('label');
      methodLabel.textContent = method;
      methodLabel.setAttribute('for', `radio-${method}`);
      methodCell.appendChild(methodLabel);

      row.appendChild(methodCell);

      // Add summed population data for each year
      sortedYears.forEach(year => {
          const dataCell = document.createElement('td');
          dataCell.textContent = yearData[year] ? yearData[year].toLocaleString() : '-';
          row.appendChild(dataCell);
      });

      tbody.appendChild(row);
  });

  table.appendChild(tbody);
  tableContainer.appendChild(table);
  resultsContainer.appendChild(tableContainer);

  // Auto-select the highest value method's radio button
  if (highestMethod) {
      highestMethod.checked = true;
  }

  // Create a "Download CSV" button
  const downloadButton = document.createElement('button');
  downloadButton.textContent = 'Download CSV';
  downloadButton.className = 'btn btn-success btn-sm mt-3 me-2';
  downloadButton.onclick = () => downloadCSV(summedList, sortedYears);
  resultsContainer.appendChild(downloadButton);

  

  // Show results section
  resultsSection.style.display = 'block';
}


// Save selected method data to dictionary and log it




// Download table data as CSV
function downloadCSV(summedList, sortedYears) {
  let csvContent = "Projection Method," + sortedYears.join(",") + "\n";

  Object.entries(summedList).forEach(([method, yearData]) => {
      const row = [method];
      sortedYears.forEach(year => {
          row.push(yearData[year] ? yearData[year] : '-');
      });
      csvContent += row.join(",") + "\n";
  });

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "projection_data.csv";
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}





function displayGrowthTable(summedList) {
    console.log("Displaying growth table");
  
    const resultsSection = document.getElementById('results-section-growth');
    const resultsContainer = document.getElementById('results-container2');
  
    // Clear previous results
    resultsContainer.innerHTML = '';
  
    if (Object.keys(summedList).length === 0) {
        resultsContainer.innerHTML = "<p>No data available.</p>";
        return;
    }
  
    // Create a responsive table container
    const tableContainer = document.createElement('div');
    tableContainer.className = 'table-responsive';
    tableContainer.style.maxWidth = '100%';
    tableContainer.style.overflowX = 'auto';
  
    // Create table
    const table = document.createElement('table');
    table.className = 'table table-bordered table-hover';
  
    // Extract all unique years
    let allYears = new Set();
    Object.values(summedList).forEach(yearData => {
        Object.keys(yearData).forEach(year => allYears.add(year));
    });
  
    // Sort years in ascending order
    const sortedYears = [...allYears].sort((a, b) => a - b);
    
    // Define base year that will be used for calculations but not displayed
    const baseYear = '2011';
    
    // Filter out the base year from display
    const displayYears = sortedYears.filter(year => year !== baseYear);
  
    // Create table header
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    headerRow.className = 'bg-light';
  
    // Add first column for method names
    const methodHeader = document.createElement('th');
    methodHeader.textContent = 'Projection Method';
    methodHeader.style.position = 'sticky';
    methodHeader.style.left = '0';
    methodHeader.style.backgroundColor = '#f8f9fa';
    methodHeader.style.zIndex = '1';
    headerRow.appendChild(methodHeader);
  
    // Add year columns (excluding base year)
    displayYears.forEach(year => {
        const yearHeader = document.createElement('th');
        yearHeader.textContent = year;
        headerRow.appendChild(yearHeader);
    });
  
    thead.appendChild(headerRow);
    table.appendChild(thead);
  
    // Create table body
    const tbody = document.createElement('tbody');
  
    // Add rows for each projection method
    Object.entries(summedList).forEach(([method, yearData]) => {
        const row = document.createElement('tr');
  
        // Add method name as first column
        const methodCell = document.createElement('td');
        methodCell.textContent = method;
        methodCell.className = 'fw-bold';
        methodCell.style.position = 'sticky';
        methodCell.style.left = '0';
        methodCell.style.backgroundColor = '#ffffff';
        methodCell.style.zIndex = '1';
        row.appendChild(methodCell);
  
        // Get the base year value for growth calculation
        const baseValue = yearData[baseYear];
  
        // Add growth percentage data for each year (excluding base year)
        displayYears.forEach(year => {
            const dataCell = document.createElement('td');
  
            if (yearData[year] !== undefined && baseValue !== undefined) {
                const growth = ((yearData[year] - baseValue) / baseValue * 100).toFixed(2);
                dataCell.textContent = `${growth}%`;
            } else {
                dataCell.textContent = '-';
            }
  
            row.appendChild(dataCell);
        });
  
        tbody.appendChild(row);
    });
  
    table.appendChild(tbody);
    tableContainer.appendChild(table);
    resultsContainer.appendChild(tableContainer);
  
    // Show results section
    resultsSection.style.display = 'block';
  }


  let alertShown = false;
  async function handleProjection(projectionMethod, list) {
      if (alertShown) return;

      const state = document.getElementById('state').value;
      const district = document.getElementById('district-btn').value;
      const subdistrict = document.getElementById('subdistrict-btn').value;
      const selectedVillages = Object.keys(persistentSelections.villages)
      .map(villageId => `village-${villageId}`);
      const persistentSelection = persistentSelections.villages
      const baseYear = document.getElementById('base-year').value;
      const yearSelection = document.querySelector('input[name="year_selection"]:checked')?.value;
      console.log("Selected Villages is ",selectedVillages);
      
      let targetYear = null;
      let targetYearRange = null;

      if (yearSelection === 'single') {
          targetYear = targetYearInput.value;
      } else if (yearSelection === 'range') {
          targetYearRange = {
              start: targetYearRangeStart.value,
              end: targetYearRangeEnd.value,
          };
      }

      if (!state || selectedVillages.length === 0 || !projectionMethod || (!targetYear && (!targetYearRange || !targetYearRange.start || !targetYearRange.end))) {
          alertShown = true;
          alert('Please fill out all required fields.');
          setTimeout(() => { alertShown = false }, 1000);
          return;
      }

      alertShown = false;

      const requestData = {
          state,
          district,
          subdistrict,
          villages: selectedVillages,
          persistentSelection,
          baseYear,
          projectionMethod,
          targetYear,
          targetYearRange,
          csrfmiddlewaretoken: '{{ csrf_token }}',
      };

      try {
          const response = await fetch('/population/calculate/', {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json',
              },
              body: JSON.stringify(requestData),
          });

          const data = await response.json();

          if (data.success && data.result) {
              console.log("Fetched result:", data.result);
              list.push({ [projectionMethod]: data.result });  // Store properly
          }
      } catch (error) {
          console.error("Error fetching data:", error);
      }
  }
});









// ------------------demographic methods calculation------------------------

document.addEventListener("DOMContentLoaded", function () {
  // Enable/Disable year inputs based on selection
  document.querySelectorAll("input[name='year_selection']").forEach((radio) => {
    radio.addEventListener("change", function () {
      const isRange = this.value === "range";
      document.getElementById("target-year").disabled = isRange;
      document.getElementById("target-year-range-start").disabled = !isRange;
      document.getElementById("target-year-range-end").disabled = !isRange;
    });
  });



  function populateTable(result, projectionMethod) {
    const containerId = `dynamic-tables-${projectionMethod}`;
    const dynamicTableContainer = document.getElementById(containerId);

    // Clear previous tables in the selected container
    dynamicTableContainer.innerHTML = '';

    const methodData = result[projectionMethod];
    if (!methodData || Object.keys(methodData).length === 0) {
        console.error("No data available for projection method:", projectionMethod);
        const errorMessage = document.createElement('p');
        errorMessage.textContent = `No data available for ${projectionMethod.replace(/-/g, ' ').toUpperCase()}`;
        dynamicTableContainer.appendChild(errorMessage);
        return;
    }
  
    const tableContainer = document.createElement('div');
    tableContainer.classList.add('mb-5');
  
    const title = document.createElement('h4');
    title.textContent = projectionMethod.replace(/-/g, ' ').toUpperCase();
    tableContainer.appendChild(title);
  
    const tableWrapper = document.createElement('div');
    tableWrapper.style.overflowX = 'auto'; // Allow horizontal scrolling
    tableWrapper.style.maxWidth = '100%'; // Prevent from exceeding container width
  
    const table = document.createElement('table');
    table.classList.add('table', 'table-bordered', 'table-striped');
    table.id = `table-${projectionMethod}`; // Unique ID for the table
  
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    headerRow.innerHTML = '<th>Village/Town Name</th>';
  
    const firstVillageData = Object.values(methodData)[0];
    if (!firstVillageData) {
        console.error("First village data is undefined or null.");
        return;
    }
  
    const firstVillageYears = Object.keys(firstVillageData);
    firstVillageYears.forEach(year => {
        const th = document.createElement('th');
        th.textContent = year;
        headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);
  
    const tbody = document.createElement('tbody');
    let totalPopulation = {}; // Store total for each year
    
    console.log("methodDatapopTable", methodData);
  
    
    
    for (const villageCode in methodData) {
        console.log("villagecodee ",villageCode);
        
        const row = document.createElement('tr');
        const villageCell = document.createElement('td');
        villageCell.textContent = code_to_villagename[villageCode] || "END";
        row.appendChild(villageCell);
  
        const yearData = methodData[villageCode];
        firstVillageYears.forEach(year => {
            const yearCell = document.createElement('td');
            yearCell.textContent = yearData[year] || '-';
  
            let population = parseInt(yearData[year], 10) || 0;
            totalPopulation[year] = (totalPopulation[year] || 0) + population;
  
            row.appendChild(yearCell);
        });
  
        tbody.appendChild(row);
    }
  
    // Add the total row at the end
    const totalRow = document.createElement('tr');
    totalRow.style.fontWeight = "bold";
    totalRow.style.backgroundColor = "#f8f9fa";
  
    const totalLabelCell = document.createElement('td');
    totalLabelCell.textContent = "Total Population";
    totalRow.appendChild(totalLabelCell);
    
    let prev2TotalPop = 0;
  
    firstVillageYears.forEach(year => {
      console.log("yearissss",year);
      const totalCell = document.createElement('td');
        if(year!=='Growth Percent'){
          totalCell.textContent = totalPopulation[year] || '-';
        }
        if(year!=='Growth Percent'){
          totalRow.appendChild(totalCell);
        }
        else if(year === 'Growth Percent'){
          prev2TotalPop=((totalPopulation[firstVillageYears[1]] - totalPopulation[firstVillageYears[0]] ) / totalPopulation[firstVillageYears[0]] ) * 100
          prev2TotalPop = prev2TotalPop.toFixed(2); //to 2 decimal places
          totalCell.textContent = prev2TotalPop>0 ? prev2TotalPop : "NA"
          totalRow.appendChild(totalCell);
        }
    });
  
    tbody.appendChild(totalRow);
    table.appendChild(tbody);
    tableWrapper.appendChild(table);
    tableContainer.appendChild(tableWrapper);
    dynamicTableContainer.appendChild(tableContainer);
}

});





  



      