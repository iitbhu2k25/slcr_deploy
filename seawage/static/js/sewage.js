document.addEventListener('DOMContentLoaded', () => {
    // Element references
    const methodsDropdown = document.getElementById('methods_dropdown');
    const demandTypeField = document.getElementById('demand_type');
    const stateDropdown = document.getElementById('state_dropdown');
    const districtDropdown = document.getElementById('district_dropdown');
    const subdistrictDropdown = document.getElementById('subdistrict_dropdown');
    // Removed original yearDropdown as we now use radio buttons and dedicated inputs
    const populationField = document.getElementById('population_field');
    const domesticField = document.getElementById('domestic_field');
    const calculateButton = document.getElementById('calculate_button');
    const resultContainer = document.getElementById('result_container');
    const populationContainer = document.getElementById('population_container');
    // const floatingContainer = document.getElementById('floating_field');
    // const enuDropdown = document.getElementById('enu_dropdown');
    // const facilityDropdown = document.getElementById('facility_dropdown');
    const villageContainer = document.getElementById('village-container');
    const selectedVillagesContainer = document.getElementById('selected-villages');
    const demandContainer = document.getElementById('domestic_container');
    const supplyContainer = document.getElementById('supply_container');
    const totalPopulationContainer = document.getElementById('total-population');

    // New year selection elements (for modeled method)
    const singleYearRadio = document.getElementById('single_year_radio');
    const rangeYearRadio = document.getElementById('range_year_radio');
    const singleYearDropdown = document.getElementById('single_year_dropdown');
    const startYearInput = document.getElementById('start_year_input');
    const endYearInput = document.getElementById('end_year_input');

    const unmeteredContainer = document.getElementById('unmetered_container');
    const unmeteredField = document.getElementById('unmetered_field');
    const pollutionLoadBtn = document.getElementById('pollution_load_btn');
    const pollutionLoadContainer = document.getElementById('pollution_load_container');
    const downloadCsvBtn = document.getElementById('download_csv_btn');

    downloadCsvBtn.style.display = "none";
    pollutionLoadBtn.style.display = "none";
    

    // Global variable to store sewage generation data for later use
    let sewageData = [];

    // Initially hide elements that are not needed
    demandTypeField.parentElement.classList.add('hidden');
    singleYearRadio.parentElement.classList.add('hidden');
    rangeYearRadio.parentElement.classList.add('hidden');
    singleYearDropdown.parentElement.classList.add('hidden');
    startYearInput.parentElement.classList.add('hidden');
    endYearInput.parentElement.classList.add('hidden');
    unmeteredContainer.classList.add('hidden');
    //populationContainer.classList.add('hidden');


    
    // Populate single-year dropdown (from 2025 to 2060)
    for (let year = 2025; year <= 2060; year++) {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year;
        singleYearDropdown.appendChild(option);
    }

    // When the method changes, show/hide appropriate sections
    methodsDropdown.addEventListener('change', () => {
        const selectedMethod = methodsDropdown.value;
        console.log('Selected Method:', selectedMethod);
        // Hide sections by default
        demandTypeField.parentElement.classList.add('hidden');
        supplyContainer.classList.add('hidden');
        demandContainer.classList.add('hidden');
        // For sector-based (domestic sewage estimation) show the demand type selection
        if (selectedMethod === 'sector_based') {
            demandTypeField.parentElement.classList.remove('hidden');
        } else if (selectedMethod === 'water_supply') {
            // For water supply, hide demand type and show the water supply input
            demandTypeField.parentElement.classList.add('hidden');
            supplyContainer.classList.remove('hidden');
            unmeteredContainer.classList.add('hidden');
            singleYearRadio.parentElement.classList.add('hidden');
            rangeYearRadio.parentElement.classList.add('hidden');
            singleYearDropdown.parentElement.classList.add('hidden');
            startYearInput.parentElement.classList.add('hidden');
            endYearInput.parentElement.classList.add('hidden');
            resultContainer.textContent = ('');
            pollutionLoadContainer.textContent = ('');
            downloadCsvBtn.style.display = "none";
            pollutionLoadBtn.style.display = "none";
            demandTypeField.value = "";
            // Hide village-related containers when in water supply mode

           
        }
    });

    // When demand type changes, toggle year selection and other fields
    demandTypeField.addEventListener('change', () => {
        const demandType = demandTypeField.value;

        // Reset/hide all related sections first
        singleYearRadio.parentElement.classList.add('hidden');
        rangeYearRadio.parentElement.classList.add('hidden');
        singleYearDropdown.parentElement.classList.add('hidden');
        startYearInput.parentElement.classList.add('hidden');
        endYearInput.parentElement.classList.add('hidden');
        demandContainer.classList.add('hidden');
        unmeteredContainer.classList.add('hidden');

        // Always show village selection and subdistrict container
        villageContainer.classList.remove('hidden');
        selectedVillagesContainer.classList.remove('hidden');
        subdistrictDropdown.parentElement.classList.remove('hidden');

        if (demandType === 'modeled') {
            // For modeled demand, allow selection between Single Year or Year Range
            singleYearRadio.parentElement.classList.remove('hidden');
            rangeYearRadio.parentElement.classList.remove('hidden');
            
            // Show all year inputs
            singleYearDropdown.parentElement.classList.remove('hidden');
            startYearInput.parentElement.classList.remove('hidden');
            endYearInput.parentElement.classList.remove('hidden');
            
            // Check if any radio is selected
            if (!singleYearRadio.checked && !rangeYearRadio.checked) {
                // If no radio selected, disable all inputs and blur them
                singleYearDropdown.disabled = true;
                startYearInput.disabled = true;
                endYearInput.disabled = true;
                
                singleYearDropdown.parentElement.classList.add('blurred');
                startYearInput.parentElement.classList.add('blurred');
                endYearInput.parentElement.classList.add('blurred');
            } else if (singleYearRadio.checked) {
                // Enable single year, disable range
                singleYearDropdown.disabled = false;
                startYearInput.disabled = true;
                endYearInput.disabled = true;
                
                singleYearDropdown.parentElement.classList.remove('blurred');
                startYearInput.parentElement.classList.add('blurred');
                endYearInput.parentElement.classList.add('blurred');
            } else if (rangeYearRadio.checked) {
                // Disable single year, enable range
                singleYearDropdown.disabled = true;
                startYearInput.disabled = false;
                endYearInput.disabled = false;
                
                singleYearDropdown.parentElement.classList.add('blurred');
                startYearInput.parentElement.classList.remove('blurred');
                endYearInput.parentElement.classList.remove('blurred');
            }
            unmeteredContainer.classList.remove('hidden');
        } else if (demandType === 'manual') {
            // For manual demand, show the domestic water demand input
            demandContainer.classList.remove('hidden');
            
            resultContainer.textContent = '';
            pollutionLoadContainer.textContent = '';
            downloadCsvBtn.style.display = "none";
            pollutionLoadBtn.style.display = "none";
        } else {
            // If no valid option is selected, clear the result container
            resultContainer.textContent = '';
        }
    });

    // Toggle year selection mode based on radio buttons
    singleYearRadio.addEventListener('change', () => {
        // Instead of hiding range inputs, just disable them and add a blur effect
        singleYearDropdown.parentElement.classList.remove('hidden');
        startYearInput.parentElement.classList.remove('hidden');
        endYearInput.parentElement.classList.remove('hidden');
        
        // Enable single year input and disable range inputs
        singleYearDropdown.disabled = false;
        startYearInput.disabled = true;
        endYearInput.disabled = true;
        
        // Add blur effect to disabled inputs
        singleYearDropdown.parentElement.classList.remove('blurred');
        startYearInput.parentElement.classList.add('blurred');
        endYearInput.parentElement.classList.add('blurred');
    });
    

    rangeYearRadio.addEventListener('change', () => {
        // Keep all inputs visible
        singleYearDropdown.parentElement.classList.remove('hidden');
        startYearInput.parentElement.classList.remove('hidden');
        endYearInput.parentElement.classList.remove('hidden');
        
        // Disable single year dropdown and enable range inputs
        singleYearDropdown.disabled = true;
        startYearInput.disabled = false;
        endYearInput.disabled = false;
        
        // Add blur effect to disabled input
        singleYearDropdown.parentElement.classList.add('blurred');
        startYearInput.parentElement.classList.remove('blurred');
        endYearInput.parentElement.classList.remove('blurred');
    });


    // Fetch locations for dropdowns
    const fetchLocations = (url, dropdown, placeholder) => {
        fetch(url)
            .then(response => response.json())
            .then(locations => {
                locations.sort((a, b) => a.name.localeCompare(b.name));
                dropdown.innerHTML = ''; // Clear any existing options
                const defaultOption = document.createElement('option');
                defaultOption.value = '';
                defaultOption.textContent = placeholder;
                dropdown.appendChild(defaultOption);
                locations.forEach(location => {
                    const option = document.createElement('option');
                    option.value = location.code;
                    option.textContent = location.name;
                    dropdown.appendChild(option);
                });
            })
            .catch(error => console.error('Error fetching locations:', error));
    };

    // Fetch villages based on the selected subdistrict
    const fetchVillages = (url, container, selectedContainer) => {
        fetch(url)
            .then(response => response.json())
            .then(villages => {
                container.innerHTML = ''; // Clear container
                if (villages.length === 0) {
                    container.innerHTML = '<p class="text-center">No villages available.</p>';
                    return;
                }
                // Separate special village (code === 0) and others
                const specialVillage = villages.find(village => village.code === 0);
                const otherVillages = villages.filter(village => village.code !== 0);
                // Sort other villages alphabetically
                otherVillages.sort((a, b) => a.name.localeCompare(b.name));
                // Function to create a checkbox for each village
                const addCheckbox = (village, displayName) => {
                    const checkboxWrapper = document.createElement('div');
                    checkboxWrapper.classList.add('form-check');
                    const checkbox = document.createElement('input');
                    checkbox.type = 'checkbox';
                    checkbox.classList.add('form-check-input');
                    checkbox.id = `village_${village.code}`;
                    checkbox.value = village.code;
                    checkbox.dataset.name = village.name;
                    const label = document.createElement('label');
                    label.classList.add('form-check-label');
                    label.htmlFor = `village_${village.code}`;
                    label.textContent = displayName;
                    checkbox.addEventListener('change', () => {
                        updateSelectedVillages(selectedContainer, totalPopulationContainer);
                    });
                    checkboxWrapper.appendChild(checkbox);
                    checkboxWrapper.appendChild(label);
                    return checkboxWrapper;
                };
                // Add special village at the top if available
                if (specialVillage) {
                    container.appendChild(addCheckbox(specialVillage, ' ALL'));
                }
                // Add the remaining villages
                otherVillages.forEach(village => {
                    container.appendChild(addCheckbox(village, village.name));
                });
            })
            .catch(error => console.error('Error fetching villages:', error));
    };

    // Update the display of selected villages and fetch their population data
    const updateSelectedVillages = (selectedContainer, totalPopulationContainer) => {
        const selectedCheckboxes = document.querySelectorAll('#village-container input[type="checkbox"]:checked');
        const selectedVillages = Array.from(selectedCheckboxes).map(checkbox => ({
            code: checkbox.value,
            name: checkbox.dataset.name
        }));
        let url = '';
        let populationLevel = '';
        if (selectedVillages.length > 0) {
            const villageCodes = selectedVillages.map(v => v.code);
            url = `waterdemand/get_village_population/?state_code=${stateDropdown.value}&district_code=${districtDropdown.value}&subdistrict_code=${subdistrictDropdown.value}&village_codes=${villageCodes.join(',')}`;
            populationLevel = 'village';
        } else {
            if (districtDropdown.value === "0") {
                url = `waterdemand/get_village_population/?state_code=${stateDropdown.value}&district_code=${districtDropdown.value}&subdistrict_code=0&village_codes=0`;
                populationLevel = 'state';
            } else {
                url = `waterdemand/get_village_population/?state_code=${stateDropdown.value}&district_code=${districtDropdown.value}&subdistrict_code=${subdistrictDropdown.value}&village_codes=0`;
                populationLevel = 'district';
            }
        }
        fetch(url)
            .then(response => response.json())
            .then(data => {
                const populationData = data.population_data;
                if (populationLevel === 'village') {
                    selectedContainer.innerHTML = populationData.map(village =>
                        `<span class="badge bg-primary me-1">${village.name} (Population in 2011: ${village.population_2011})</span>`
                    ).join('');
                    const totalPopulation = populationData.reduce((acc, village) => acc + village.population_2011, 0);
                    totalPopulationContainer.innerHTML = `Total population: ${totalPopulation}`;
                } else {
                    selectedContainer.innerHTML = '';
                    totalPopulationContainer.innerHTML = 'Total population: 0';
                }
            })
            .catch(error => console.error('Error fetching population data:', error));
    };

    // Fetch locations for state, district, and subdistrict dropdowns
    fetchLocations('waterdemand/get_locations/', stateDropdown, 'Select State');

    stateDropdown.addEventListener('change', () => {
        fetchLocations(`waterdemand/get_locations/?state_code=${stateDropdown.value}`, districtDropdown, 'Select District');
    });

    districtDropdown.addEventListener('change', () => {
        fetchLocations(`waterdemand/get_locations/?state_code=${stateDropdown.value}&district_code=${districtDropdown.value}`, subdistrictDropdown, 'Select Subdistrict');
    });

    subdistrictDropdown.addEventListener('change', () => {
        const url = `waterdemand/get_locations/?state_code=${stateDropdown.value}&district_code=${districtDropdown.value}&subdistrict_code=${subdistrictDropdown.value}`;
        fetchVillages(url, villageContainer, selectedVillagesContainer);
        updateSelectedVillages(selectedVillagesContainer, totalPopulationContainer);
    });

    // Calculate button click event handler
    calculateButton.addEventListener('click', async (event) => {
        event.preventDefault();
        // Clear previous results and display a calculating message
        resultContainer.textContent = '';
        resultContainer.innerHTML = '<h5 class="text-primary">Calculating...</h5>';
        await new Promise(resolve => setTimeout(resolve, 700));
    
        // Validate that at least one village is selected
        const selectedVillages = Array.from(
            document.querySelectorAll('#village-container input[type="checkbox"]:checked')
        ).map(checkbox => checkbox.value);
        if (selectedVillages.length === 0) {
            alert('Please select at least one village.');
            return;
        }
    
        // Get location values
        const stateCode = stateDropdown.value;
        const districtCode = districtDropdown.value;
        const subdistrictCode = subdistrictDropdown.value;
    
        // Determine which method is selected
        const method = methodsDropdown.value;
        if (!method) {
            alert('Please select a valid method.');
            return;
        }
    
        // If the method is Water Supply, perform its calculation
        if (method === 'water_supply') {
            const supplyDemand = parseFloat(document.getElementById('supply_field').value) || 0;
            if (!supplyDemand) {
                alert('Please enter water supply.');
                return;
            }
            const sewageDemand = supplyDemand * 0.84;
            resultContainer.textContent = `Total Generated Sewage Water is: ${sewageDemand.toFixed(2)} MLD`;
            // Hide any pollution load or CSV download buttons if visible
            pollutionLoadBtn.style.display = "none";
            downloadCsvBtn.style.display = "none";
            return;
        }
        // Else, if the method is Domestic Sewage Load Estimation
        else if (method === 'sector_based') {
            const demandType = demandTypeField.value;
            if (!demandType) {
                alert('Please select a valid domestic sewage demand type.');
                return;
            }
    
            // For modeled demand, retrieve unmetered water supply and calculate based on year selection
            if (demandType === 'modeled') {
                const unmetered = parseFloat(unmeteredField.value) || 0;
                
                // Single Year Mode
                if (singleYearRadio.checked) {
                    const selectedYear = singleYearDropdown.value;
                    if (!selectedYear) {
                        alert('Please select a valid year.');
                        return;
                    }
                    const url = `waterdemand/get_combined_population/?state_code=${stateCode}&district_code=${districtCode}&subdistrict_code=${subdistrictCode}&year=${selectedYear}&villages[]=${selectedVillages.join('&villages[]=')}`;
                    try {
                        const response = await fetch(url);
                        const data = await response.json();
                        if (data.combined_population) {
                            const population = data.combined_population;
                            const baseCoefficient = population >= 1000000 ? 150 : 135;
                            const totalCoefficient = baseCoefficient + unmetered;
                            const demandValue = population * totalCoefficient / 1000000;
                            const sewage = demandValue * 0.80;
                            resultContainer.textContent = `Total Generated Sewage Water is: ${sewage.toFixed(2)} MLD`;
                        } else if (data.error) {
                            alert(data.error);
                        }
                    } catch (error) {
                        console.error('Error fetching population data:', error);
                    }
                }
                // Year Range Mode: iterate over 5-year intervals
                else if (rangeYearRadio.checked) {
                    const startYear = parseInt(startYearInput.value);
                    const endYear = parseInt(endYearInput.value);
                    if (!startYear || !endYear || startYear >= endYear || startYear < 2025 || endYear > 2060) {
                        alert("Please enter a valid year range (2025-2060).");
                        return;
                    }
                    let yearsToFetch = [];
                    for (let year = startYear; year <= endYear; year += 5) {
                        yearsToFetch.push(year);
                    }
                    try {
                        let tableHTML = `
                            <table class="table table-striped">
                                <thead>
                                    <tr>
                                        <th>Year</th>
                                        <th>Projected Population</th>
                                        <th>Sewage Generation (MLD)</th>
                                    </tr>
                                </thead>
                                <tbody>
                        `;
                        for (const year of yearsToFetch) {
                            const url = `waterdemand/get_combined_population/?state_code=${stateCode}&district_code=${districtCode}&subdistrict_code=${subdistrictCode}&year=${year}&villages[]=${selectedVillages.join('&villages[]=')}`;
                            const response = await fetch(url);
                            const data = await response.json();
                            if (data.combined_population) {
                                const population = data.combined_population;
                                const baseCoefficient = population >= 1000000 ? 150 : 135;
                                const totalCoefficient = baseCoefficient + unmetered;
                                const demandValue = population * totalCoefficient / 1000000;
                                const sewage = demandValue * 0.80;
                                tableHTML += `
                                    <tr>
                                        <td>${year}</td>
                                        <td>${Math.round(population)}</td>
                                        <td>${sewage.toFixed(2)}</td>
                                    </tr>
                                `;
                            } else if (data.error) {
                                tableHTML += `
                                    <tr>
                                        <td>${year}</td>
                                        <td colspan="2" class="text-danger">${data.error}</td>
                                    </tr>
                                `;
                            }
                        }
                        tableHTML += '</tbody></table>';
                        resultContainer.innerHTML = tableHTML;
                    } catch (error) {
                        console.error('Error fetching sewage estimation:', error);
                    }
                }
                // Show additional buttons for pollution load details and CSV download
                pollutionLoadBtn.style.display = "block";
                downloadCsvBtn.style.display = "block";
            }
            // For manual demand entry
            else if (demandType === 'manual') {
                const waterDemand = parseFloat(domesticField.value) || 0;
                if (!waterDemand) {
                    alert('Please enter water demand.');
                    return;
                }
                const sewageDemand = waterDemand * 0.84;
                resultContainer.textContent = `Total Generated Sewage Water is: ${sewageDemand.toFixed(2)} MLD`;
            }
            else {
                alert('Please select a valid domestic sewage demand type.');
            }
        }
        else {
            alert('Please select a valid method.');
        }
    });
    
    pollutionLoadBtn.addEventListener('click', (event) => {
        event.preventDefault();
        // Instead of using window.lastPopulation, we fetch population using the selected year.
        let selectedYear;
        if (singleYearRadio.checked) {
            selectedYear = singleYearDropdown.value;
        } else if (rangeYearRadio.checked) {
            // For range mode, use the start year
            selectedYear = startYearInput.value;
        }
        if (!selectedYear) {
            alert("Please select a valid year for fetching population.");
            return;
        }
        const stateCode = stateDropdown.value;
        const districtCode = districtDropdown.value;
        const subdistrictCode = subdistrictDropdown.value;
        const selectedVillages = Array.from(document.querySelectorAll('#village-container input[type="checkbox"]:checked'))
            .map(checkbox => checkbox.value);
        
        const url = `waterdemand/get_combined_population/?state_code=${stateCode}&district_code=${districtCode}&subdistrict_code=${subdistrictCode}&year=${selectedYear}&villages[]=${selectedVillages.join('&villages[]=')}`;
        fetch(url)
            .then(response => response.json())
            .then(data => {
                if (data.combined_population) {
                    const population = data.combined_population;
                    const baseCoefficient = population >= 1000000 ? 150 : 135;
                    const unmetered = parseFloat(unmeteredField.value) || 0;
                    const totalCoefficient = (baseCoefficient + unmetered) * 0.80;
                    
                    // Build the pollution load table with three columns: Item, Editable Per Capita, Concentration
                    let table = document.createElement('table');
                    table.className = "table table-striped";
                    let thead = document.createElement('thead');
                    let trHead = document.createElement('tr');
                    
                    let thItem = document.createElement('th');
                    thItem.textContent = "Item";
                    let thPerCapita = document.createElement('th');
                    thPerCapita.textContent = "Per Capita Contribution (g/c/d)";
                    let thConcentration = document.createElement('th');
                    thConcentration.textContent = "Concentration (mg/l)";
                    
                    trHead.appendChild(thItem);
                    trHead.appendChild(thPerCapita);
                    trHead.appendChild(thConcentration);
                    thead.appendChild(trHead);
                    table.appendChild(thead);
                    
                    let tbody = document.createElement('tbody');
                    
                    const pollutionItems = [
                        { name: "BOD", perCapita: 27.0 },
                        { name: "COD", perCapita: 45.9 },
                        { name: "TSS", perCapita: 40.5 },
                        { name: "VSS", perCapita: 28.4 },
                        { name: "Total Nitrogen", perCapita: 5.4 },
                        { name: "Organic Nitrogen", perCapita: 1.4 },
                        { name: "Ammonia Nitrogen", perCapita: 3.5 },
                        { name: "Nitrate Nitrogen", perCapita: 0.5 },
                        { name: "Total Phosphorus", perCapita: 0.8 },
                        { name: "Ortho Phosphorous", perCapita: 0.5 }
                    ];
                    
                    pollutionItems.forEach((item, index) => {
                        let tr = document.createElement('tr');
                        
                        let tdItem = document.createElement('td');
                        tdItem.textContent = item.name;
                        
                        let tdPerCapita = document.createElement('td');
                        let inputPerCapita = document.createElement('input');
                        inputPerCapita.type = "number";
                        inputPerCapita.className = "form-control";
                        // Default value from pollutionItems array
                        inputPerCapita.value = item.perCapita;
                        inputPerCapita.id = "percapita_input_" + index;
                        tdPerCapita.appendChild(inputPerCapita);
                        
                        let tdConcentration = document.createElement('td');
                        tdConcentration.id = "concentration_" + index;
                        // Initial concentration calculation using default per capita
                        let concentration = (item.perCapita / totalCoefficient) * 1000;
                        tdConcentration.textContent = concentration.toFixed(1);
                        
                        tr.appendChild(tdItem);
                        tr.appendChild(tdPerCapita);
                        tr.appendChild(tdConcentration);
                        tbody.appendChild(tr);
                        
                        // Attach an event listener to update concentration when per capita value changes
                        inputPerCapita.addEventListener('input', () => {
                            let editedPerCapita = parseFloat(inputPerCapita.value) || 0;
                            let newConcentration = (editedPerCapita / totalCoefficient) * 1000;
                            tdConcentration.textContent = newConcentration.toFixed(1);
                        });
                    });
                    
                    table.appendChild(tbody);
                    pollutionLoadContainer.innerHTML = "";
                    pollutionLoadContainer.appendChild(table);
                } else {
                    alert("Population data not available.");
                }
            })
            .catch(error => console.error("Error fetching population data:", error));
    });
    // Download CSV button click event handler
    downloadCsvBtn.addEventListener('click', (event) => {
        event.preventDefault();
        // Retrieve the pollution load table from the container
        const table = pollutionLoadContainer.querySelector("table");
        if (!table) {
            alert("No pollution load data available to download.");
            return;
        }
        let csvContent = "data:text/csv;charset=utf-8,";
        // Get header row
        const headers = Array.from(table.querySelectorAll("thead th")).map(th => th.textContent.trim());
        csvContent += headers.join(",") + "\n";
        // Iterate through each row in the tbody
        const rows = table.querySelectorAll("tbody tr");
        rows.forEach(row => {
            const cols = Array.from(row.querySelectorAll("td")).map(td => {
                // If the cell contains an input, get its value; otherwise, use textContent.
                const input = td.querySelector("input");
                return input ? input.value.trim() : td.textContent.trim();
            });
            csvContent += cols.join(",") + "\n";
        });
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "pollution_load_data.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });
      
});
