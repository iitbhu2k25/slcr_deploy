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


    
    // When the method changes, show/hide appropriate sections
    methodsDropdown.addEventListener('change', () => {
        const selectedMethod = methodsDropdown.value;
        console.log('Selected Method:', selectedMethod);
        
        // Reset all fields and containers
        demandTypeField.parentElement.classList.add('hidden');
        supplyContainer.classList.add('hidden');
        demandContainer.classList.add('hidden');
        
        // // Reset dropdowns
        // stateDropdown.selectedIndex = 0;
        // districtDropdown.innerHTML = '<option value="">Select District</option>';
        // subdistrictDropdown.innerHTML = '<option value="">Select Subdistrict</option>';
        
        // // Reset village-related containers and checkboxes
        // villageContainer.innerHTML = ''; // Clear village checkboxes
        // selectedVillagesContainer.innerHTML = ''; // Clear selected villages
        // totalPopulationContainer.innerHTML = 'Total population: 0';
        
        // Reset population and demand fields
        document.getElementById('supply_field').value = '';
        document.getElementById('domestic_field').value = '';
        resultContainer.textContent = '';
        
        // Reset year inputs
        singleYearDropdown.selectedIndex = 0;
        startYearInput.value = '';
        endYearInput.value = '';
        singleYearRadio.checked = false;
        rangeYearRadio.checked = false;
        
        // Hide year-related elements
        singleYearRadio.parentElement.classList.add('hidden');
        rangeYearRadio.parentElement.classList.add('hidden');
        singleYearDropdown.parentElement.classList.add('hidden');
        startYearInput.parentElement.classList.add('hidden');
        endYearInput.parentElement.classList.add('hidden');
        
        // // Hide village-related containers
        // villageContainer.classList.add('hidden');
        // selectedVillagesContainer.classList.add('hidden');
        
        // For sector-based (domestic sewage estimation) show the demand type selection
        if (selectedMethod === 'sector_based') {
            demandTypeField.parentElement.classList.remove('hidden');
            // When sector-based is selected, we want to show village container
            villageContainer.classList.remove('hidden');
            selectedVillagesContainer.classList.remove('hidden');
        } else if (selectedMethod === 'water_supply') {
            // For water supply, hide demand type and show the water supply input
            demandTypeField.parentElement.classList.add('hidden');
            supplyContainer.classList.remove('hidden');
            
        }
    });

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

        // Always show village selection and subdistrict container
        villageContainer.classList.remove('hidden');
        selectedVillagesContainer.classList.remove('hidden');
        subdistrictDropdown.parentElement.classList.remove('hidden');
        if (demandType === 'modeled') {
            // For modeled demand, show radio buttons
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
        } else if (demandType === 'manual') {
            // For manual demand, show the domestic water demand input
            demandContainer.classList.remove('hidden');
        } else {
            // If no valid option is selected, clear the result container
            resultContainer.textContent = '';
        }
    });

    // Toggle year selection mode based on radio buttons
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
        resultContainer.textContent = ''; // Clear previous result
        event.preventDefault();
        
        resultContainer.innerHTML = '<h5 class="text-primary">Calculating...</h5>';
        await new Promise(resolve => setTimeout(resolve, 700)); // Brief delay for UI update

        const selectedVillages = Array.from(
            document.querySelectorAll('#village-container input[type="checkbox"]:checked')
        ).map(checkbox => checkbox.value);

        if (selectedVillages.length === 0) {
            alert('Please select at least one village.');
            return;
        }

        const stateCode = stateDropdown.value;
        const districtCode = districtDropdown.value;
        const subdistrictCode = subdistrictDropdown.value;
        const demandType = demandTypeField.value;

        if (demandType === 'modeled') {
            // Modeled demand
            if (singleYearRadio.checked) {
                // Single Year Mode
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
                        const demandValue = population >= 1000000 ? population * 150 / 1000000 : population * 135 / 1000000;
                        const sewage = demandValue * 0.84;
                        resultContainer.textContent = `Total Generated Sewage Water is: ${sewage.toFixed(2)} MLD`;
                    } else if (data.error) {
                        alert(data.error);
                    }
                } catch (error) {
                    console.error('Error fetching population data:', error);
                }
            } else if (rangeYearRadio.checked) {
                // Year Range Mode: iterate over 5-year intervals
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
                            const demandValue = population >= 1000000 ? population * 150 / 1000000 : population * 135 / 1000000;
                            const sewage = demandValue * 0.84;
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
        } else if (demandType === 'manual') {
            // Manual demand entry
            const waterdemand = parseFloat(domesticField.value) || 0;
            if (!waterdemand) {
                alert('Please enter water demand.');
                return;
            }
            const sewagedemand = waterdemand * 0.84;
            resultContainer.textContent = `Total Generated Sewage Water is: ${sewagedemand.toFixed(2)} MLD`;
        } else if (methodsDropdown.value === 'water_supply') {
            resultContainer.textContent = ''; // Clear previous result
            // Water supply method
            const supplydemand = parseFloat(document.getElementById('supply_field').value) || 0;
            if (!supplydemand) {
                alert('Please enter water supply.');
                return;
            }
            const sewagedemand = supplydemand * 0.84;
            resultContainer.textContent = `Total Generated Sewage Water is: ${sewagedemand.toFixed(2)} MLD`;
        } else {
            alert('Please select a valid demand type.');
        }
    });
});
