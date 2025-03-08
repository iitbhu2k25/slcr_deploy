document.addEventListener('DOMContentLoaded', () => {
    const demandTypeField = document.getElementById('demand_type');
    const stateDropdown = document.getElementById('state_dropdown');
    const districtDropdown = document.getElementById('district_dropdown');
    const subdistrictDropdown = document.getElementById('subdistrict_dropdown');
    const yearDropdown = document.getElementById('year_dropdown');
    const populationField = document.getElementById('population_field');
    const floatingField = document.getElementById('floating_field');
    const enuDropdown = document.getElementById('enu_dropdown');
    const methodsDropdown = document.getElementById('methods_dropdown');
    const facilityDropdown = document.getElementById('facility_dropdown');
    const calculateButton = document.getElementById('calculate_button');
    const resultContainer = document.getElementById('result_container');
    const yearContainer = document.getElementById('year_container');
    const institutionalContainer = document.getElementById('institutional_container');
    const firefightingContainer = document.getElementById('firefighting_container');
    const totalDemandField = document.getElementById('totaldemand');
    const intermediateStageField = document.getElementById('intermediate_stage');
    const intermediateStagePopulationField = document.getElementById('population_load_intermediate'); // For Intermediate Stage Population
    const populationContainer = document.getElementById('population_container');
    const floatingContainer = document.getElementById('floating_container');
    const enuContainer = document.getElementById('enu_container');
    const methodContainer = document.getElementById('method_container');
    const facilityContainer = document.getElementById('facility_container');
    const villageContainer = document.getElementById('village-container');
    const selectedVillagesContainer = document.getElementById('selected-villages');
    const totalPopulationContainer = document.getElementById('total-population');
    const domesticContainer = document.querySelector('.domestic-fields-container');
    const floatingFieldsContainer = document.querySelector('.floating-fields-container');


    let state=null;
    let district=null;
    if (yearDropdown.options.length <= 1) { 
        for (let i = 2021; i <= 2060; i++) {
            let option = document.createElement("option");
            option.value = i;
            option.textContent = i;
            yearDropdown.appendChild(option);
        }
    }
    // Global variable to track if the user manually changed the intermediate population value
    let intermediatePopulationOverridden = false;
    document.getElementById('population_load_intermediate').addEventListener('input', () => {
        intermediatePopulationOverridden = true;
    });


    const totalDemandCheckboxes = {
        domestic: document.getElementById('checkbox_domestic'),
        floating: document.getElementById('checkbox_floating'),
        institutional: document.getElementById('checkbox_institutional'),
        firefighting: document.getElementById('checkbox_firefighting'),
    };

    const totalDemandFields = {
        domestic: [
            document.querySelector('.domestic-fields-container')

        ],
        floating: [
            document.querySelector('.floating-fields-container')
        ],
        institutional: [
            document.getElementById('institutional_container')
        ],
        firefighting: [
            document.getElementById('firefighting_container')
        ],
    };
    
    
    

    // Function to toggle visibility of fields based on checkbox selection
    const toggleFields = (key, isChecked) => {
        const fields = totalDemandFields[key];
        console.log(`Toggling fields for: ${key}, Checked: ${isChecked}`);
        fields.forEach(field => {
            if (field) {
                if (isChecked) {
                    // Show the field and add the border class
                    field.classList.remove('hidden');
                    field.classList.add('bordered-container');
                } else {
                    // Hide the field and remove the border class
                    field.classList.add('hidden');
                    field.classList.remove('bordered-container');
                }
            } else {
                console.error(`Field for ${key} is undefined.`);
            }
        });
    };
    
    

    // Add event listeners to the checkboxes
    Object.entries(totalDemandCheckboxes).forEach(([key, checkbox]) => {
        checkbox.addEventListener('change', () => {
            toggleFields(key, checkbox.checked);
        });
    });
    

    const fetchLocations = (url, dropdown, placeholder) => {
        fetch(url)
            .then(response => response.json())
            .then(locations => {


                locations.sort((a, b) => a.name.localeCompare(b.name));


                dropdown.innerHTML = ''; // Clear existing options
                const defaultOption = document.createElement('option');
                defaultOption.value = '';
                defaultOption.textContent = placeholder;
                dropdown.appendChild(defaultOption);

                locations.forEach(location => {
                    console.log('location',location)
                    const option = document.createElement('option');
                    option.value = location.code;
                    option.textContent = location.name;
                    dropdown.appendChild(option);
                });
            })
            .catch(error => console.error('Error fetching locations:', error));
    };


    const fetchVillages = (url, container, selectedContainer) => {
        fetch(url)
            .then(response => response.json())
            .then(villages => {
                container.innerHTML = ''; // Clear the container
    
                if (villages.length === 0) {
                    container.innerHTML = '<p class="text-center">No villages available.</p>';
                    return;
                }
    
                // Separate villages with code === 0
                const specialVillage = villages.find(village => village.code === 0);
                const otherVillages = villages.filter(village => village.code !== 0);
    
                // Sort other villages by name in alphabetical order
                otherVillages.sort((a, b) => a.name.localeCompare(b.name));
    
                // Create a function to add a checkbox
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
    
                // Add the special village (code === 0) at the top, with the name "ALL"
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
    
    
    const updateSelectedVillages = (selectedContainer, totalPopulationContainer) => {
        const selectedCheckboxes = document.querySelectorAll('#village-container input[type="checkbox"]:checked');
        const selectedVillages = Array.from(selectedCheckboxes).map(checkbox => ({
            code: checkbox.value,
            name: checkbox.dataset.name
        }));
    
        let url = '';
        let populationLevel = '';
    
        // If any village checkboxes are selected, fetch village-level population
        if (selectedVillages.length > 0) {
            const villageCodes = selectedVillages.map(v => v.code);
            url = `waterdemand/get_village_population/?state_code=${stateDropdown.value}&district_code=${districtDropdown.value}&subdistrict_code=${subdistrictDropdown.value}&village_codes=${villageCodes.join(',')}`;
            populationLevel = 'village';
        } else {
            // If no village is selected, default to district (or state) level as appropriate
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
                    // For district or state, assume one record is returned
                    selectedContainer.innerHTML = '';
                    totalPopulationContainer.innerHTML = 'Total population: 0';
                }
            })
            .catch(error => console.error('Error fetching population data:', error));
    };
    
    
    
    
    
    
    
    


    fetchLocations('waterdemand/get_locations/', stateDropdown, 'Select State');

    stateDropdown.addEventListener('change', () => {
        const stateCode = stateDropdown.value;
        console.log(stateCode)
        fetchLocations(`waterdemand/get_locations/?state_code=${stateCode}`, districtDropdown, 'Select District')
    });

    districtDropdown.addEventListener('change', () => {
        const stateCode = stateDropdown.value;
        const districtCode = districtDropdown.value;
        console.log(state)
        fetchLocations(`waterdemand/get_locations/?state_code=${stateCode}&district_code=${districtCode}`, subdistrictDropdown, 'Select Subdistrict');
    });

    subdistrictDropdown.addEventListener('change', () => {
        const stateCode = stateDropdown.value;
        const districtCode = districtDropdown.value;
        const subdistrictCode = subdistrictDropdown.value;

        if (subdistrictCode) {
            const url = `waterdemand/get_locations/?state_code=${stateCode}&district_code=${districtCode}&subdistrict_code=${subdistrictCode}`;
            fetchVillages(url, villageContainer, selectedVillagesContainer);
        }
        updateSelectedVillages(selectedContainer, totalPopulationContainer);
    });

    
    
    


    demandTypeField.addEventListener('change', () => {
        const demandType = demandTypeField.value;
    
        // Reset all sections to hidden by default
        
        // Hide all sections by default
        domesticContainer.classList.add('hidden');
        floatingFieldsContainer.classList.add('hidden');
        villageContainer.classList.add('hidden');
        selectedVillagesContainer.classList.add('hidden'); // Hide selected villages text
        subdistrictDropdown.parentElement.classList.add('hidden'); // Hide subdistrict container
        institutionalContainer.classList.add('hidden');
        firefightingContainer.classList.add('hidden');
        document.getElementById('totaldemand').classList.add('hidden');
    
        // Show/hide fields based on the selected demand type
        if (demandType === 'domestic') {
            domesticContainer.classList.remove('hidden');
            villageContainer.classList.remove('hidden');
            selectedVillagesContainer.classList.remove('hidden'); // Show selected village text
            subdistrictDropdown.parentElement.classList.remove('hidden'); // Show subdistrict container
        } else if (demandType === 'floating') {
            floatingFieldsContainer.classList.remove('hidden');
            villageContainer.classList.remove('hidden');
            selectedVillagesContainer.classList.remove('hidden');
            subdistrictDropdown.parentElement.classList.remove('hidden');
        } else if (demandType === 'institutional') {
            institutionalContainer.classList.remove('hidden');
            villageContainer.classList.remove('hidden');
            selectedVillagesContainer.classList.remove('hidden'); // Show selected village text
            subdistrictDropdown.parentElement.classList.remove('hidden'); // Show subdistrict container
        } else if (demandType === 'firefighting') {
            firefightingContainer.classList.remove('hidden');
            villageContainer.classList.remove('hidden');
            selectedVillagesContainer.classList.remove('hidden'); // Show selected village text
            subdistrictDropdown.parentElement.classList.remove('hidden'); // Show subdistrict container
        } else if (demandType === 'total') {
            document.getElementById('totaldemand').classList.remove('hidden');
            villageContainer.classList.remove('hidden');
            selectedVillagesContainer.classList.remove('hidden'); // Show selected village text
            subdistrictDropdown.parentElement.classList.remove('hidden'); // Show subdistrict container
            
        } else {
            // If no valid demand type is selected, hide everything
            resultContainer.textContent = '';
        }
    });
    
    

    yearDropdown.addEventListener('change', () => {
        const stateCode = stateDropdown.value;
        const districtCode = districtDropdown.value;
        const subdistrictCode = subdistrictDropdown.value;
        const selectedVillages = Array.from(
            document.querySelectorAll('#village-container input[type="checkbox"]:checked')
        ).map(checkbox => checkbox.value);
        const year = yearDropdown.value;
    
        console.log("Selected Villages:", selectedVillages);
    
        if (year && stateCode && districtCode && subdistrictCode && selectedVillages.length > 0) {
            // Prepare villages as a query parameter
            const villagesQuery = selectedVillages
                .map(v => `villages[]=${encodeURIComponent(v)}`)
                .join('&');
            
            // Build the URL
            const url = `waterdemand/get_combined_population/?state_code=${stateCode}&district_code=${districtCode}&subdistrict_code=${subdistrictCode}&year=${year}&${villagesQuery}`;
    
            fetch(url)
                .then(response => response.json())
                .then(data => {
                    if (data.combined_population) {
                        populationField.value = Math.floor(data.combined_population).toString(); // Auto-populate the field
                    } else if (data.error) {
                        alert(data.error);
                    }
                })
                .catch(error => console.error('Error fetching combined population data:', error));
        } else {
            alert('Please select all required fields, including at least one village.');
        }
    });
    
    

 

    intermediateStageField.addEventListener('input', () => {
        const intermediateStage = intermediateStageField.value.trim() === '' ? 0 : parseInt(intermediateStageField.value, 10);
        const stateCode = stateDropdown.value;
        const districtCode = districtDropdown.value;
        const subdistrictCode = subdistrictDropdown.value;
        const selectedVillages = Array.from(
            document.querySelectorAll('#village-container input[type="checkbox"]:checked')
        ).map(checkbox => checkbox.value);

        // Default autopopulation for blank input
        if (intermediateStage === 0) {
            intermediateStagePopulationField.value = 0;
            return;
        }
    
        // Validate intermediate stage
        if (isNaN(intermediateStage) || intermediateStage < 1 || intermediateStage > 50) {
            alert("Invalid Stage");
            intermediateStageField.value = '';
            intermediateStagePopulationField.value = '';
            return;
        }

        if (!stateCode || !districtCode || !subdistrictCode || selectedVillages.length === 0) {
            alert('Please select a state, district, subdistrict, and at least one village.');
            return;
        }
    
        // Debugging Logs
        console.log('Intermediate Stage:', intermediateStage);
        console.log('Selected Villages:', selectedVillages);
        
        // Encode villages[] as separate parameters
        const villagesQuery = selectedVillages.map(village => `villages[]=${encodeURIComponent(village)}`).join('&');
        // Initialize the URL
        const url = `waterdemand/get_combined_population/?state_code=${stateCode}&district_code=${districtCode}&subdistrict_code=${subdistrictCode}&intermediate_stage=${intermediateStage}&${villagesQuery}`;
    
        // Log the URL after initialization
        console.log('Request URL:', url);
    
        // Fetch intermediate stage population
        fetch(url)
            .then(response => response.json())
            .then(data => {
                console.log('Fetched Response:', data); // Debug log for response
                if (data.intermediate_stage_population) {
                    // Update the intermediate stage population field
                    intermediateStagePopulationField.value = Math.floor(data.intermediate_stage_population).toString();
                } else if (data.error) {
                    alert(data.error);
                    intermediateStagePopulationField.value = '';
                }
            })
            .catch(error => {
                console.error('Error fetching intermediate stage population:', error);
            });
    });
    
    
    

    enuDropdown.addEventListener('change', () => {
        const stateCode = stateDropdown.value;
        const districtCode = districtDropdown.value;
        const subdistrictCode = subdistrictDropdown.value;
        const selectedVillages = Array.from(
            document.querySelectorAll('#village-container input[type="checkbox"]:checked')
        ).map(checkbox => checkbox.value);
        const enu = enuDropdown.value;
    
        console.log("State Code:", stateCode);
        console.log("District Code:", districtCode);
        console.log("Enumeration Type:", enu);
        console.log("subdistrict code:", subdistrictCode);
        console.log('Selected Villages:', selectedVillages);
    
        if (!stateCode || !districtCode || !enu) {
            alert('Please select State, District, and Enumeration Type.');
            return;
        }
    
        // Encode villages[] as separate parameters
        const villagesQuery = selectedVillages.map(village => `villages[]=${encodeURIComponent(village)}`).join('&');
        // Initialize the URL
        const url = `waterdemand/get_floating/?state_code=${stateCode}&district_code=${districtCode}&subdistrict_code=${subdistrictCode}&enu=${enu}&${villagesQuery}`;
    
        fetch(url)
            .then(response => response.json())
            .then(data => {
                if (data.floating_population) {
                    floatingField.value = data.floating_population; // Populate the floating population field
                } else if (data.error) {
                    alert(data.error);
                }
            })
            .catch(error => console.error('Error fetching floating population:', error));
    });
    

    calculateButton.addEventListener('click', async (event) => {
        event.preventDefault();
        resultContainer.textContent = '';
        
        const selectedVillages = Array.from(
            document.querySelectorAll('#village-container input[type="checkbox"]:checked')
        ).map(checkbox => checkbox.value);
    
        if (selectedVillages.length === 0) {
            alert('Please select at least one village.');
            return;
        }
        if (demandTypeField.value === 'domestic') {
            const stateCode = stateDropdown.value;
            const districtCode = districtDropdown.value;
            const subdistrictCode = subdistrictDropdown.value;
            const year = yearDropdown.value;

            if (!year || !stateCode || !districtCode || !subdistrictCode) {
                alert('Please select State, District, and Subdistrict.');
                return;
            }

            const population = parseFloat(populationField.value);
            if (!population || isNaN(population)) {
                alert('Population data is invalid. Please check the input.');
                return;
            }
            
            // Calculate demand based on population size
            const demand = population >= 1000000 
                ? population * 150 / 1000000 
                : population * 135 / 1000000;
            resultContainer.textContent = `Total Domestic Water Demand: ${demand.toFixed(2)} MLD`;
            
        } else if (demandTypeField.value === 'floating') {
            const floatingPopulation = parseFloat(floatingField.value);
            const facilityType = document.getElementById('facility_dropdown').value;
    
            if (isNaN(floatingPopulation) || floatingPopulation <= 0) {
                alert('Please enter a valid floating population.');
                return;
            }
    
            let multiplier;
            if (facilityType === 'provided') {
                multiplier = 45; // Bathing facilities provided
            } else if (facilityType === 'notprovided') {
                multiplier = 25; // Bathing facilities not provided
            } else if (facilityType === 'onlypublic') {
                multiplier = 15; // Floating population Using only public facilities
            } else {
                alert('Please select a valid Facility Type.');
                return;
            }
    
            const result = floatingPopulation * multiplier/1000000;
            resultContainer.textContent = `Floating Population Water Demand: ${result.toFixed(2)} MLD`;
        } else if (demandTypeField.value === 'institutional') {
            const hospitals_100_units = parseFloat(document.getElementById('hospitals_100_units').value) || 0;
            const beds_100 = parseFloat(document.getElementById('beds_100').value) || 0;
            const hospitals_less_100 = parseFloat(document.getElementById('hospitals_less_100').value) || 0;
            const beds_less_100 = parseFloat(document.getElementById('beds_less_100').value) || 0;
            const hotels = parseFloat(document.getElementById('hotels').value) || 0;
            const beds_hotels = parseFloat(document.getElementById('beds_hotels').value) || 0;
            const hostels = parseFloat(document.getElementById('hostels').value) || 0;
            const residents_hostels = parseFloat(document.getElementById('residents_hostels').value) || 0;
            const nurses_home = parseFloat(document.getElementById('nurses_home').value) || 0;
            const residents_nurses_home = parseFloat(document.getElementById('residents_nurses_home').value) || 0;
            const boarding_schools = parseFloat(document.getElementById('boarding_schools').value) || 0;
            const students_boarding_schools = parseFloat(document.getElementById('students_boarding_schools').value) || 0;
            const restaurants = parseFloat(document.getElementById('restaurants').value) || 0;
            const seats_restaurants = parseFloat(document.getElementById('seats_restaurants').value) || 0;
            const airports_seaports = parseFloat(document.getElementById('airports_seaports').value) || 0;
            const population_load_airports = parseFloat(document.getElementById('population_load_airports').value) || 0;
            const junction_stations = parseFloat(document.getElementById('junction_stations').value) || 0;
            const population_load_junction = parseFloat(document.getElementById('population_load_junction').value) || 0;
            const terminal_stations = parseFloat(document.getElementById('terminal_stations').value) || 0;
            const population_load_terminal = parseFloat(document.getElementById('population_load_terminal').value) || 0;
            const intermediate_bathing = parseFloat(document.getElementById('intermediate_bathing').value) || 0;
            const population_load_bathing = parseFloat(document.getElementById('population_load_bathing').value) || 0;
            const intermediate_no_bathing = parseFloat(document.getElementById('intermediate_no_bathing').value) || 0;
            const population_load_no_bathing = parseFloat(document.getElementById('population_load_no_bathing').value) || 0;
            const day_schools = parseFloat(document.getElementById('day_schools').value) || 0;
            const students_day_schools = parseFloat(document.getElementById('students_day_schools').value) || 0;
            const offices = parseFloat(document.getElementById('offices').value) || 0;
            const employees_offices = parseFloat(document.getElementById('employees_offices').value) || 0;
            const factories_bathroom = parseFloat(document.getElementById('factories_bathroom').value) || 0;
            const employees_factories_bathroom = parseFloat(document.getElementById('employees_factories_bathroom').value) || 0;
            const factories_no_bathroom = parseFloat(document.getElementById('factories_no_bathroom').value) || 0;
            const employees_factories_no_bathroom = parseFloat(document.getElementById('employees_factories_no_bathroom').value) || 0;
            const cinemas = parseFloat(document.getElementById('cinemas').value) || 0;
            const population_load_cinemas = parseFloat(document.getElementById('population_load_cinemas').value) || 0;



            if (isNaN(hospitals_100_units) || isNaN(beds_100) || isNaN(hospitals_less_100) || isNaN(beds_less_100) || isNaN(hotels) || isNaN(beds_hotels) || isNaN(hostels) || isNaN(residents_hostels) || isNaN(nurses_home) || isNaN(residents_nurses_home) || isNaN(boarding_schools) || isNaN(students_boarding_schools) || isNaN(restaurants) || isNaN(seats_restaurants) || isNaN(airports_seaports) || isNaN(population_load_airports) || isNaN(junction_stations) || isNaN(population_load_junction) || isNaN(terminal_stations) || isNaN(population_load_terminal) || isNaN(intermediate_bathing) || isNaN(population_load_bathing) || isNaN(intermediate_no_bathing) || isNaN(population_load_no_bathing) || isNaN(day_schools) || isNaN(students_day_schools) || isNaN(offices) || isNaN(employees_offices) || isNaN(factories_bathroom) || isNaN(employees_factories_bathroom) || isNaN(factories_no_bathroom) || isNaN(employees_factories_no_bathroom) || isNaN(cinemas) || isNaN(population_load_cinemas)) {
                alert('Please enter valid numbers for all fields.');
                return;
            }
        
            const totalDemand =
                ((hospitals_100_units * beds_100 * 450) + (hospitals_less_100 * beds_less_100 * 350) + (hotels * beds_hotels * 180) + (hostels * residents_hostels * 135) + (nurses_home * residents_nurses_home * 135) + (boarding_schools * students_boarding_schools * 135) + (restaurants * seats_restaurants * 70) + (airports_seaports * population_load_airports * 70) + (junction_stations * population_load_junction * 70) + (terminal_stations * population_load_terminal * 45) + (intermediate_bathing * population_load_bathing * 45) + (intermediate_no_bathing * population_load_no_bathing * 25) + (day_schools * students_day_schools * 45) + (offices * employees_offices * 45) + (factories_bathroom * employees_factories_bathroom * 45) + (factories_no_bathroom * employees_factories_no_bathroom * 30) + (cinemas * population_load_cinemas * 15))/1000000;
            resultContainer.textContent = `Institutional Water Demand is ${totalDemand} MLD`;
       
        }  else if (demandTypeField.value === 'firefighting') {
            const intermediateStage = parseInt(intermediateStageField.value, 10);
            const stateCode = stateDropdown.value;
            const districtCode = districtDropdown.value;
            const subdistrictCode = subdistrictDropdown.value;
            const populationLoadOperational = parseInt(document.getElementById('population_load_operational').value);
            const operationalZone = document.getElementById('operational_zone').value;
        
            if (selectedVillages.length === 0) {
                alert('Please select at least one village.');
                return;
            }
        
            if (isNaN(intermediateStage) || intermediateStage < 1 || intermediateStage > 50) {
                alert('Please enter a valid intermediate stage (1-50).');
                return;
            }
        
            if (!stateCode || !districtCode || !subdistrictCode) {
                alert('Please select valid State, District, and Subdistrict.');
                return;
            }
        
            let population; // This will hold the intermediate stage population value
        
            // If the user has not manually overridden the field, fetch the population from the server
            if (!intermediatePopulationOverridden) {
                const villagesQuery = selectedVillages
                    .map(village => `villages[]=${encodeURIComponent(village)}`)
                    .join('&');
                const url = `waterdemand/get_combined_population/?state_code=${stateCode}&district_code=${districtCode}&subdistrict_code=${subdistrictCode}&intermediate_stage=${intermediateStage}&${villagesQuery}`;
                console.log('Fetching URL for Firefighting:', url); // Debug log
        
                try {
                    const response = await fetch(url);
                    const data = await response.json();
        
                    console.log('Fetched Firefighting Data:', data); // Debug log
        
                    if (data.error) {
                        alert(data.error);
                        return;
                    }
        
                    if (data.intermediate_stage_population) {
                        population = data.intermediate_stage_population;
                        // Populate the field with the fetched population so the user can see and override it if needed
                        const populationField = document.getElementById('population_load_intermediate');
                        if (populationField) {
                            populationField.value = Math.floor(population).toString();
                        }
                    }
                } catch (error) {
                    console.error('Error fetching firefighting data:', error);
                    alert('An error occurred while fetching firefighting data. Please try again.');
                    return;
                }
            } else {
                // Use the manually entered population value from the field
                const populationField = document.getElementById('population_load_intermediate');
                population = parseFloat(populationField.value);
            }
        
            if (!population || isNaN(population)) {
                alert('Intermediate stage population data is invalid. Please check the input.');
                return;
            }
        
            // Calculate firefighting water demand
            const waterRequirement = Math.sqrt(population / 1000000); // Adjust calculation logic as needed
            const operationalZoneWaterRequirement = (populationLoadOperational * waterRequirement) / population;
            resultContainer.textContent = `
        - Intermediate Stage Water Requirement: ${waterRequirement.toFixed(2)} MLD
        - Operational Zone (${operationalZone}) Water Requirement: ${operationalZoneWaterRequirement.toFixed(2)} MLD
            `;
        
        } else if (demandTypeField.value === 'total') {
            console.log('Calculating Total Demand...');

            let totalDemand = 0;

            // Domestic Demand
            if (totalDemandCheckboxes.domestic.checked) {
                console.log('Calculating Domestic Demand...');
                const year = yearDropdown.value;
                const population = parseFloat(populationField.value) || 0;
                if (population && year) {
                    totalDemand += population >= 1000000 ? population * 150/1000000 : population * 135/1000000;
                    console.log(`Domestic Demand: ${totalDemand}`);
                } else {
                    console.log('Invalid inputs for Domestic Demand.');
                }
            }

            // Floating Demand
            if (totalDemandCheckboxes.floating.checked) {
                console.log('Calculating Floating Demand...');
                const floatingPopulation = parseInt(floatingField.value) || 0;
                const facilityType = facilityDropdown.value;

                let multiplier = 0;
                if (facilityType === 'provided') multiplier = 45/1000000;
                else if (facilityType === 'notprovided') multiplier = 25/1000000;
                else if (facilityType === 'onlypublic') multiplier = 15/1000000;

                totalDemand += floatingPopulation * multiplier;
                console.log(`Floating Demand: ${floatingPopulation * multiplier}`);
            }

            // Institutional Demand
            if (totalDemandCheckboxes.institutional.checked) {
                const hospitals_100_units = parseFloat(document.getElementById('hospitals_100_units').value) || 0;
                const beds_100 = parseFloat(document.getElementById('beds_100').value) || 0;
                const hospitals_less_100 = parseFloat(document.getElementById('hospitals_less_100').value) || 0;
                const beds_less_100 = parseFloat(document.getElementById('beds_less_100').value) || 0;
                const hotels = parseFloat(document.getElementById('hotels').value) || 0;
                const beds_hotels = parseFloat(document.getElementById('beds_hotels').value) || 0;
                const hostels = parseFloat(document.getElementById('hostels').value) || 0;
                const residents_hostels = parseFloat(document.getElementById('residents_hostels').value) || 0;
                const nurses_home = parseFloat(document.getElementById('nurses_home').value) || 0;
                const residents_nurses_home = parseFloat(document.getElementById('residents_nurses_home').value) || 0;
                const boarding_schools = parseFloat(document.getElementById('boarding_schools').value) || 0;
                const students_boarding_schools = parseFloat(document.getElementById('students_boarding_schools').value) || 0;
                const restaurants = parseFloat(document.getElementById('restaurants').value) || 0;
                const seats_restaurants = parseFloat(document.getElementById('seats_restaurants').value) || 0;
                const airports_seaports = parseFloat(document.getElementById('airports_seaports').value) || 0;
                const population_load_airports = parseFloat(document.getElementById('population_load_airports').value) || 0;
                const junction_stations = parseFloat(document.getElementById('junction_stations').value) || 0;
                const population_load_junction = parseFloat(document.getElementById('population_load_junction').value) || 0;
                const terminal_stations = parseFloat(document.getElementById('terminal_stations').value) || 0;
                const population_load_terminal = parseFloat(document.getElementById('population_load_terminal').value) || 0;
                const intermediate_bathing = parseFloat(document.getElementById('intermediate_bathing').value) || 0;
                const population_load_bathing = parseFloat(document.getElementById('population_load_bathing').value) || 0;
                const intermediate_no_bathing = parseFloat(document.getElementById('intermediate_no_bathing').value) || 0;
                const population_load_no_bathing = parseFloat(document.getElementById('population_load_no_bathing').value) || 0;
                const day_schools = parseFloat(document.getElementById('day_schools').value) || 0;
                const students_day_schools = parseFloat(document.getElementById('students_day_schools').value) || 0;
                const offices = parseFloat(document.getElementById('offices').value) || 0;
                const employees_offices = parseFloat(document.getElementById('employees_offices').value) || 0;
                const factories_bathroom = parseFloat(document.getElementById('factories_bathroom').value) || 0;
                const employees_factories_bathroom = parseFloat(document.getElementById('employees_factories_bathroom').value) || 0;
                const factories_no_bathroom = parseFloat(document.getElementById('factories_no_bathroom').value) || 0;
                const employees_factories_no_bathroom = parseFloat(document.getElementById('employees_factories_no_bathroom').value) || 0;
                const cinemas = parseFloat(document.getElementById('cinemas').value) || 0;
                const population_load_cinemas = parseFloat(document.getElementById('population_load_cinemas').value) || 0;

                const institutionalDemand =
                    (hospitals_100_units * beds_100 * 450) +
                    (hospitals_less_100 * beds_less_100 * 350) +
                    (hotels * beds_hotels * 180) +
                    (hostels * residents_hostels * 135) +
                    (nurses_home * residents_nurses_home * 135) +
                    (boarding_schools * students_boarding_schools * 135) +
                    (restaurants * seats_restaurants * 70) +
                    (airports_seaports * population_load_airports * 70) +
                    (junction_stations * population_load_junction * 70) +
                    (terminal_stations * population_load_terminal * 45) +
                    (intermediate_bathing * population_load_bathing * 45) +
                    (intermediate_no_bathing * population_load_no_bathing * 25) +
                    (day_schools * students_day_schools * 45) +
                    (offices * employees_offices * 45) +
                    (factories_bathroom * employees_factories_bathroom * 45) +
                    (factories_no_bathroom * employees_factories_no_bathroom * 30) +
                    (cinemas * population_load_cinemas * 15);

                totalDemand += institutionalDemand/1000000;
                console.log(`Institutional Demand: ${institutionalDemand/1000000}`);
            }

            // Firefighting Demand
            if (totalDemandCheckboxes.firefighting.checked) {
                console.log('Calculating Firefighting Demand...');
                const intermediateStage = parseInt(intermediateStageField.value, 10);
                const populationIntermediate = parseInt(intermediateStagePopulationField.value) || 0;

                if (!isNaN(intermediateStage) && !isNaN(populationIntermediate)) {
                    const waterRequirement = Math.sqrt(populationIntermediate / 1000000);
                    totalDemand += waterRequirement;
                    console.log(`Firefighting Demand: ${waterRequirement}`);
                } else {
                    console.log('Invalid inputs for Firefighting Demand.');
                }
            }
            // Display the result
            console.log(`Total Demand Calculated: ${totalDemand.toFixed(2)} MLD`);
            resultContainer.textContent = `Total Water Demand: ${totalDemand.toFixed(2)} MLD`;
        }
        
        else {
            alert('Please select a valid demand type.');
        }
    });
});