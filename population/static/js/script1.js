let code_to_villagename = {};
let villagePopulations = {};
let chartInstances = {};

document.addEventListener('DOMContentLoaded', () => {
    // Fetch states on page load
    fetch('/population/get-states/')
      .then(response => response.json())
      .then(states => populateDropdown('state', states, 'state_code', 'region_name'))
      .catch(error => console.error('Error fetching states:', error));
  
    // Event listener for state selection
    document.getElementById('state').addEventListener('change', function () {
      const stateCode = this.value;
      if (stateCode) {
        fetch(`/population/get-districts/${stateCode}/`)
          .then(response => response.json())
          .then(districts => populateDropdown('district', districts, 'district_code', 'region_name'))
          .catch(error => console.error('Error fetching districts:', error));
      }
      resetDropdown('district');
      resetDropdown('subdistrict');
      resetTownVillage();
    });
  
    // Event listener for district selection
    document.getElementById('district').addEventListener('change', function () {
      const stateCode = document.getElementById('state').value;
      const districtCode = this.value;
      if (districtCode) {
        fetch(`/population/get-subdistricts/${stateCode}/${districtCode}/`)
          .then(response => response.json())
          .then(subdistricts => populateDropdown('subdistrict', subdistricts, 'subdistrict_code', 'region_name'))
          .catch(error => console.error('Error fetching subdistricts:', error));
      }
      resetDropdown('subdistrict');
      resetTownVillage();
    });
  
    // Event listener for subdistrict selection
    document.getElementById('subdistrict').addEventListener('change', function () {
      const stateCode = document.getElementById('state').value;
      const districtCode = document.getElementById('district').value;
      const subdistrictCode = this.value;
      if (subdistrictCode) {
        fetch(`/population/get-villages/${stateCode}/${districtCode}/${subdistrictCode}/`)
          .then(response => response.json())
          .then(villages => populateTownVillage(villages,'subdistrict_code', 'village_code', 'region_name', 'population_2011'))
          .catch(error => console.error('Error fetching villages:', error));
          
      }
      resetTownVillage();
    });
  });
  
  // Populate dropdown options
  function populateDropdown(dropdownId, data, valueKey, textKey) {
    const dropdown = document.getElementById(dropdownId);
    dropdown.innerHTML = '<option value="">Select an Option</option>';
    data.forEach(item => {
      const option = document.createElement('option');
      option.value = item[valueKey];
      option.textContent = item[textKey];
      dropdown.appendChild(option);
    });
  }
  
  // Reset dropdown options
  function resetDropdown(dropdownId) {
    const dropdown = document.getElementById(dropdownId);
    dropdown.innerHTML = '<option value="">Select an Option</option>';
  }
  
  // Populate town/village container
  function populateTownVillage(data, sdcode, vcode, rcode, pcode) {
    const container = document.getElementById('town-village-container');
    container.innerHTML = ''; // Clear previous checkboxes
    let totalPop = 0;
    
    data.forEach(item => {
        console.log("item hai g ", item);
  
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.value = item[vcode];
        checkbox.id = `village-${item[vcode]}`;
        checkbox.className = 'village-checkbox';
        villagePopulations[item[vcode]] = item[pcode];
        code_to_villagename[item[vcode]] = item[rcode];
  
        if (item[sdcode] > 0 && item[vcode] === 0) {
            totalPop += item[pcode];
        }
  
        const label = document.createElement('label');
        label.htmlFor = checkbox.id;
        label.textContent = item[rcode];
  
        const div = document.createElement('div');
        div.appendChild(checkbox);
        div.appendChild(label);
  
        container.appendChild(div);
  
        // Add event listener to update selected villages and handle "All" selection
        checkbox.addEventListener('change', function () {
            handleAllSelection();
            updateSelectedVillages();
        });
    });
  
    if (totalPop > 0) {
        villagePopulations[0] = totalPop;
    }
  
    console.log("Total popu ", totalPop);
    console.log("villagePopulations[0] ", villagePopulations[0]);
  }
  // Function to handle "All" selection behavior
function handleAllSelection() {
  const checkboxes = document.querySelectorAll('.village-checkbox');
  const allCheckbox = Array.from(checkboxes).find(cb => cb.labels.length > 0 && cb.labels[0].textContent.trim() === "All");

  if (allCheckbox && allCheckbox.checked) {
      checkboxes.forEach(cb => {
          if (cb !== allCheckbox) {
              cb.checked = false;
              cb.disabled = true;
          }
      });
  } else {
      checkboxes.forEach(cb => cb.disabled = false);
  }
}
  
  // Reset town/village container
  function resetTownVillage() {
    const container = document.getElementById('town-village-container');
    container.innerHTML = '<span>No options available</span>';
    const selectedContainer = document.getElementById('selected-villages');
    selectedContainer.innerHTML = '<span>No selections made</span>';
  }
  
 




   // Update selected villages display
function updateSelectedVillages() {
  const checkboxes = document.querySelectorAll('.village-checkbox:checked');
  const selectedContainer = document.getElementById('selected-villages');
  const totalPopulationContainer = document.getElementById('total-population');
  let totalPopulation = 0;

  if (checkboxes.length === 0) {
      selectedContainer.innerHTML = '<span>No selections made</span>';
      totalPopulationContainer.innerHTML = '';
      return;
  }

  selectedContainer.innerHTML = '';
  checkboxes.forEach(checkbox => {
      console.log("Checkbox: ", checkbox);

      const label = document.querySelector(`label[for="${checkbox.id}"]`);
      console.log("Label g: ", label);

      const div = document.createElement('div');
      const villageId = checkbox.id.split("-")[1]; // Get the village ID from the checkbox ID

      // Get the population for the village from the villagePopulations object
      const population = villagePopulations[villageId] || 0; // Default to 0 if not found
      totalPopulation += population; // Add to total population

      // Handling the "All" name
      const subdistrict = document.getElementById("subdistrict");
      const selectedSubdistrictName = subdistrict.options[subdistrict.selectedIndex]?.text || "Unknown Subdistrict";

      const district = document.getElementById("district");
      const selectedDistrictName = district.options[district.selectedIndex]?.text || "Unknown District";

      console.log("Selected Subdistrict:", selectedSubdistrictName);
      console.log("Selected district:", selectedDistrictName);

      if (label && label.textContent.trim() === "All") {
          // If "All" is selected, use subdistrict name
          div.textContent = `${selectedSubdistrictName} (Population of 2011: ${population})`;
          selectedContainer.appendChild(div);
      } else if (label && label.textContent.includes("Subdistrict")) {
          // If a subdistrict is selected, use its name
          div.textContent = `${selectedDistrictName} (Population of 2011: ${population})`;
          selectedContainer.appendChild(div);
      } else {
          // Add the village name and population next to each other
          div.textContent = `${label?.textContent || "Unknown"} (Population of 2011: ${population})`;
          selectedContainer.appendChild(div);
      }
  });

  totalPopulationContainer.textContent = `Total Population: ${totalPopulation}`;
}

  









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
      const district = document.getElementById('district').value;
      const subdistrict = document.getElementById('subdistrict').value;

      let timeSeries = document.getElementById('time-series');
      let demographic = document.getElementById('demographic-based');
      let cohort = document.getElementById('cohort-component');
      let scenario = document.getElementById('scenario-based');

     

      if (timeSeries.checked) {
          let selectedMethods = [];
          let methods = [
              "arithmetic-increase",
              "geometric-increase",
              "logistic-growth",
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

              let summedList = {};

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
                          if (year === "Growth Percent") continue;  // *Skip Growth Percent*
                          let population = Number(yearData[year]); // Ensure numerical addition
                          if (!isNaN(population)) {
                              summedList[methodName][year] = (summedList[methodName][year] || 0) + population;
                          } else {
                              console.warn(`Skipping invalid population data for ${methodName}, Year: ${year}`);
                          }
                      }
                  }
              });
          
              console.log("Summed List:", JSON.stringify(summedList, null, 2));
              renderTable(summedList);
              displayTable(summedList);

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

          await processMethods();
      }
      else if(demographic.checked){
          const birthRate = document.getElementById("birth-rate").value;
          const deathRate = document.getElementById("death-rate").value;
          const emigrationRate = document.getElementById("emigration-rate").value;
          const immigrationRate = document.getElementById("immigration-rate").value;

          // Check if any field is empty
          if (!birthRate || !deathRate || !emigrationRate || !immigrationRate) {
            alert("Please fill in all rate fields before continuing.");
            return; // Exit the function
          }

          calculateDemographic();




      }
      else if (cohort.checked || scenario.checked) {
          alert("Feature not implemented yet, working!");
          return;
      }
  });

// ----------------------------------------------------------- demographic calculationStart----------------------------------

// Async function to handle demographic calculations
async function calculateDemographic() {
  const state = document.getElementById('state').value;
  const district = document.getElementById('district').value;
  const subdistrict = document.getElementById('subdistrict').value;
      
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
  
  const requestData = {
    state,
    district,
    subdistrict,
    villages: selectedVillages,
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

      let fetchedData = data.result
      
      const summedList = { "demographic-calculation": {} };

      Object.values(fetchedData["demographic-attribute"]).forEach(entry => {
        Object.entries(entry).forEach(([year, value]) => {
          summedList["demographic-calculation"][year] = 
            (summedList["demographic-calculation"][year] || 0) + value;
        });
      });
      
      console.log(summedList);
      renderTable(summedList);
      displayTable(summedList);

      // Ensure the button appears only after the table is displayed
      toggleButton.style.display = 'block';

      // Toggle Button Functionality (Only for Graph)
      toggleButton.addEventListener('click', function (e) {
          e.preventDefault();
          
          if (chartContainer.style.display === 'none') {
              chartContainer.style.display = 'block';
              toggleButton.textContent = 'Update Graph';
              displayLineGraph(summedList);  // Generate Chart
          } else {
              chartContainer.style.display = 'none';
              toggleButton.textContent = 'Update Graph';
          }
      });
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
    console.log("andar display table");
    
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

    // Show results section
    resultsSection.style.display = 'block';
}


  let alertShown = false;
  async function handleProjection(projectionMethod, list) {
      if (alertShown) return;

      const state = document.getElementById('state').value;
      const district = document.getElementById('district').value;
      const subdistrict = document.getElementById('subdistrict').value;
      const selectedVillages = Array.from(document.querySelectorAll('#town-village-container input[type="checkbox"]:checked'))
          .map(village => village.id);
      const baseYear = document.getElementById('base-year').value;
      const yearSelection = document.querySelector('input[name="year_selection"]:checked')?.value;

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










  // --editinggg_________________-----

  document.addEventListener("DOMContentLoaded", function () {
    console.log("Script loaded and running");

    const graphMapping = {
        "graphbtn-arithmetic-increase": "container-arithmetic-increase",
        "graphbtn-geometric-increase": "container-geometric-increase",
        "graphbtn-logistic-growth": "container-logistic-growth",
        "graphbtn-exponential-growth": "container-exponential-growth",
        "graphbtn-incremental-growth": "container-incremental-growth",
    };

    // Make sure all graph containers are hidden at the start
    Object.values(graphMapping).forEach(graphContainerId => {
        const container = document.getElementById(graphContainerId);
        if (container) {
            console.log(`Hiding container: ${graphContainerId}`);
            container.style.display = "none";
        } else {
            console.log(`Container not found & its no a problem: ${graphContainerId}`);
        }
    });

    // Attach event listeners to all buttons
    Object.keys(graphMapping).forEach(btnId => {
        const button = document.getElementById(btnId);
        const graphContainer = document.getElementById(graphMapping[btnId]);

        if (button && graphContainer) {
            console.log(`Adding event listener to button: ${btnId}`);
            button.addEventListener("click", function (e) {
                e.preventDefault(); 

                if (graphContainer.style.display === "none" || graphContainer.style.display === "") {
                    console.log(`Showing: ${graphMapping[btnId]}`);
                    graphContainer.style.display = "block";
                } else {
                    console.log(`Hiding: ${graphMapping[btnId]}`);
                    graphContainer.style.display = "none";
                }
            });
        } else {
            console.log(`Button or container not found for ID and its no a problem: ${btnId}`);
        }
    });
});






      

   





       




  
      // button.addEventListener("click", function (e) {
      //   e.preventDefault(); // Prevent any default behavior
  
      //   const selectedContainer = document.getElementById(graphContainerId);
  
      //   // If the clicked graph is already visible, hide it
      //   if (selectedContainer.style.display === "block") {
      //     selectedContainer.style.display = "none";
      //     selectedContainer.classList.remove("active");
  
      //     // If no graph is visible, hide the entire graphsView section
      //     const anyGraphVisible = Object.values(graphMapping).some(
      //       (id) => document.getElementById(id).style.display === "block"
      //     );
  
      //     if (!anyGraphVisible) {
      //       graphsView.style.display = "none";
      //     }
      //   } else {
      //     // Hide all graphs before showing the selected one
      //     Object.values(graphMapping).forEach((containerId) => {
      //       const container = document.getElementById(containerId);
      //       container.style.display = "none"; // Hide all graphs
      //       container.classList.remove("active");
      //     });
  
      //     // Show the graphs section
      //     graphsView.style.display = "block";
  
      //     // Show the selected graph container
      //     selectedContainer.style.display = "block";
      //     selectedContainer.classList.add("active");
      //   }
      // });
   
  
  













  // js for showing graph-----------------------------------------------------------------------------------------------------------------------------------------------------------


  // document.addEventListener("DOMContentLoaded", () => {
  //   const projectionMethodDropdown = document.getElementById("projection-method");
  //   const toggleViewButton = document.getElementById("toggle-view");
  //   const tablesView = document.querySelector(".tables-view");
  //   const graphsView = document.querySelector(".graphs-view");
  
  //   let isGraphView = false;
  
  //   toggleViewButton.addEventListener("click", (e) => {
  //     e.preventDefault();
  //     isGraphView = !isGraphView;
  //     toggleViewButton.textContent = isGraphView ? "Show Tables" : "Show Graphs";
  //     tablesView.style.display = isGraphView ? "none" : "block";
  //     graphsView.style.display = isGraphView ? "block" : "none";
  
  //     // Update visibility of graphs based on selected method
  //     updateProjectionView();
  //   });
  
  //   projectionMethodDropdown.addEventListener("change", updateProjectionView);
  
  //   function updateProjectionView() {
  //     const selectedMethod = projectionMethodDropdown.value;
    
  //     // Hide all tables and graphs
  //     document.querySelectorAll(".projection-item").forEach((item) => (item.style.display = "none"));
  //     document.querySelectorAll(".graph-container").forEach((container) => {
  //       container.classList.remove("active");
  //       container.style.display = "none"; // Hide graph containers by default
  //     });
    
  //     if (selectedMethod === "all") {
  //       if (isGraphView) {
  //         document.querySelectorAll(".graph-container").forEach((container) => {
  //           container.classList.add("active");
  //           container.style.display = "block"; // Ensure visibility
  //         });
  //       } else {
  //         document.querySelectorAll(".projection-item").forEach((item) => (item.style.display = "block"));
  //       }
  //     } else {
  //       const specificTable = document.querySelector(`.projection-item.${selectedMethod}`);
  //       const specificGraphContainer = document.getElementById(`container-${selectedMethod}`);
    
  //       if (isGraphView) {
  //         specificGraphContainer.classList.add("active");
  //         specificGraphContainer.style.display = "block"; // Show selected graph
  //       } else if (specificTable) {
  //         specificTable.style.display = "block"; // Show selected table
  //       }
  //     }
  //   }
    
    
  // });

  
  // Example renderGraph function call:
    function renderGraph(canvasId, datasets, labels) {
      console.log("I inside renderGraph");
      
      const canvas = document.getElementById(canvasId);
    
      // Ensure the parent container and canvas are visible
      const container = canvas.parentElement;
      container.style.display = "block";
      container.classList.add("active");
    
      // Resize the canvas to fit its container
      canvas.style.width = "100%";
      canvas.style.height = "350px"; // Set an appropriate height
    
      // Destroy the previous chart instance if it exists
      if (chartInstances[canvasId]) {
        chartInstances[canvasId].destroy();
      }
    
      // Create a new chart instance and store it
      const ctx = canvas.getContext("2d");
      const chart = new Chart(ctx, {
        type: "line",
        data: {
          labels: labels,
          datasets: datasets,
        },
        options: {
          responsive: true,
          maintainAspectRatio: false, // Adjust dimensions freely
          plugins: {
            legend: { position: "top" },
          },
          scales: {
            x: { title: { display: true, text: "Years" } },
            y: { title: { display: true, text: "Population" } },
          },
        },
      });
    
      // Save the chart instance for future cleanup
      chartInstances[canvasId] = chart;
    }

    function renderGraphforSingleYear(canvasId, datasets, labels) {
      console.log("Inside renderGraphforSingleYear");
  
      const canvas = document.getElementById(canvasId);
      const container = canvas.parentElement;
      container.style.display = "block";
      container.classList.add("active");
  
      // Resize canvas
      canvas.style.width = "100%";
      canvas.style.height = "350px";
  
      // Destroy previous chart instance if it exists
      if (chartInstances[canvasId]) {
          chartInstances[canvasId].destroy();
      }
  
      // Extract village names as X-axis labels
      const villageNames = datasets.map(dataset => dataset.label);
  
      // Create dynamic datasets based on available years in labels
      const newDatasets = labels.map((year, index) => ({
          label: `${year} Population`,
          data: datasets.map(dataset => dataset.data[index]), // Get data dynamically
          backgroundColor: getRandomColor(), // Random color for each year
          borderColor: getRandomColor(),
          borderWidth: 1,
      }));
  
      // Create a grouped bar chart (Histogram)
      const ctx = canvas.getContext("2d");
      const chart = new Chart(ctx, {
          type: "bar",
          data: {
              labels: villageNames, // Set village names as X-axis labels
              datasets: newDatasets, // Datasets for all available years
          },
          options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                  legend: { position: "top" },
              },
              scales: {
                  x: {
                      title: { display: true, text: "Villages" },
                      stacked: false, // Show bars side by side
                  },
                  y: {
                      title: { display: true, text: "Population" },
                      stacked: false,
                  },
              },
          },
      });
  
      // Save chart instance for future cleanup
      chartInstances[canvasId] = chart;
  }

  
  

  
  function getRandomColor() {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  }
  




























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

  // document.getElementById("submit-btn").addEventListener("click", function (e) {
  //     e.preventDefault();
  //     const state = document.getElementById('state').value;
  //     const district = document.getElementById('district').value;
  //     const subdistrict = document.getElementById('subdistrict').value;
      
  //     const singleYearOption = document.getElementById('single-year-option');
  //     const rangeYearOption = document.getElementById('range-year-option');
  //     const targetYearInput = document.getElementById('target-year');
  //     const targetYearRangeStart = document.getElementById('target-year-range-start');
  //     const targetYearRangeEnd = document.getElementById('target-year-range-end');

  //     const birthRate = document.getElementById("birth-rate").value;
  //     const deathRate = document.getElementById("death-rate").value;
  //     const emigrationRate = document.getElementById("emigration-rate").value;
  //     const immigrationRate = document.getElementById("immigration-rate").value;

  //     const selectedVillages = Array.from(
  //       document.querySelectorAll('#town-village-container input[type="checkbox"]:checked')
  //     ).map(village => village.id);

  //     const baseYear = document.getElementById('base-year').value;

  //     const yearSelection = document.querySelector('input[name="year_selection"]:checked')?.value;
  //     let targetYear = null;
  //     let targetYearRange = null;


  //   // Handle year selection options
  //   singleYearOption.addEventListener('change', () => {
  //     targetYearInput.disabled = false;
  //     targetYearRangeStart.disabled = true;
  //     targetYearRangeEnd.disabled = true;
  //   });

  //   rangeYearOption.addEventListener('change', () => {
  //     targetYearInput.disabled = true;
  //     targetYearRangeStart.disabled = false;
  //     targetYearRangeEnd.disabled = false;
  //   });
    

  //   if (yearSelection === 'single') {
  //     targetYear = targetYearInput.value;
  //   } else if (yearSelection === 'range') {
  //     targetYearRange = {
  //       start: targetYearRangeStart.value,
  //       end: targetYearRangeEnd.value,
  //     };
  //   }

  //   console.log("Birth rate = ", birthRate);
  //   console.log("Death rate = ", deathRate);
  //   console.log("emigration rate = ", emigrationRate);
  //   console.log("immigration rate = ", immigrationRate);
    

  //   // Validate inputs
  //   if (!state || selectedVillages.length === 0 || !birthRate || !deathRate || !emigrationRate || !immigrationRate ||
  //     (!targetYear && (!targetYearRange || !targetYearRange.start || !targetYearRange.end))) {
  //     alert('Please fill out all required fields.');
  //     return;
  //   }

    
  //   const requestData = {
  //     state,
  //     district,
  //     subdistrict,
  //     villages : selectedVillages,
  //     baseYear,
  //     targetYear,
  //     targetYearRange,
  //     birthRate,
  //     deathRate,
  //     emigrationRate,
  //     immigrationRate,
  //   };

    

  //   fetch("/population/calculate-demographic/", {
  //     method: "POST",
  //     headers: { "Content-Type": "application/json" },
  //     body: JSON.stringify(requestData),
  //   })
  //     .then(response => response.json())
  //     .then(data => {
  //       if(data.success && data.result){
  //         console.log("result = ", data.result); 
  //         populateTable(data.result, "demographic-attribute"); 

  //         let containKeyGrowthPercent = false;
  //         //Render graphs for each method
  //         Object.keys(data.result).forEach(method => {
  //           const methodData = data.result[method];
  //           console.log("Method data, ",methodData);
            
  //           Object.keys(methodData).forEach(key => {
  //             if ("Growth Percent" in methodData[key]) {
  //                 containKeyGrowthPercent=true
  //             } 
  //         });
            
          
  //           Object.values(methodData).forEach(yearData => {
  //             if (yearData) {
  //               delete yearData["Growth Percent"]; // If present, delete
  //             }
  //           });
          
  //           console.log("method ", method);
  //           console.log("methodData ", methodData);
          
  //           const canvasId = `graph-${method}`;
  //           console.log("Canvas Id ", canvasId);
          
  //           const labels = Object.keys(methodData[Object.keys(methodData)[0]]); // Years
  //           console.log("Object.keys(methodData)[0] ", Object.keys(methodData)[0]);
  //           console.log("methodData[Object.keys(methodData)[0]]", methodData[Object.keys(methodData)[0]]);
          
  //           const datasets = Object.entries(methodData).map(([village, yearData]) => {
  //             console.log(" Object.values(yearData) ", Object.values(yearData));
  //             return {
  //               label: code_to_villagename[village],
  //               data: Object.values(yearData),
  //               borderColor: getRandomColor(),
  //               borderWidth: 2,
  //               fill: false,
  //             };
  //           });
          
  //           console.log("datasets original", datasets);
  //           console.log("labels original ", labels);
          
  //           if(!containKeyGrowthPercent){
              
  //             const datasets2 = datasets.map(dataset => ({
  //               ...dataset, 
  //               data: dataset.data.slice(1) // Remove the 0th index value
  //              }));
  //              labels.shift()

  //             console.log("datasets2", datasets2);
  //             console.log("labels for range years", labels);
              
  //             renderGraph(canvasId, datasets2, labels);
  //           }
  //           else{
  //             renderGraphforSingleYear(canvasId,datasets,labels)
  //           }
  //         });
  //       }
        
  //     })
  //     .catch(error => console.error("Error:", error));
      
  // });

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