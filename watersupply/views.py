from django.shortcuts import render
from django.http import JsonResponse
from waterdemands.models import PopulationData, PopulationDataYear, FloatingData

def main_page(request):
    return render(request, 'watersupply/main.html')

# Fetch State, district, subdistrict and villages
def get_locations(request):
    """Fetch hierarchical location data."""
    state_code = request.GET.get("state_code")
    district_code = request.GET.get("district_code")
    subdistrict_code = request.GET.get("subdistrict_code")
    village_code = request.GET.get("village_code")

    try:
        if not state_code:
            # Fetch all unique states
            locations = PopulationData.objects.filter(district_code=0, subdistrict_code=0, village_code=0)
            location_list = [{"code": loc.state_code, "name": loc.region_name} for loc in locations]
            return JsonResponse(location_list, safe=False)

        elif state_code and not district_code:
            # Fetch districts within the given state
            locations = PopulationData.objects.filter(state_code=state_code, subdistrict_code=0, village_code=0)
            location_list = [{"code": loc.district_code, "name": " ALL" if loc.district_code == 0 else loc.region_name} for loc in locations]
            return JsonResponse(location_list, safe=False)

        elif state_code and district_code and not subdistrict_code:
            if district_code == "0":
                return JsonResponse([{"code": "0", "name": " ALL"}], safe=False)
            # Fetch subdistricts within the given state and district
            locations = PopulationData.objects.filter(state_code=state_code, district_code=district_code, village_code=0)
            location_list = [{"code": loc.subdistrict_code, "name": " ALL" if loc.subdistrict_code == 0 else loc.region_name} for loc in locations]
            return JsonResponse(location_list, safe=False)

        elif state_code and district_code and subdistrict_code and not village_code:

            if district_code == "0" and subdistrict_code == "0":
                return JsonResponse([{"code": "0", "name": " ALL"}], safe=False)
            # Fetch villages based on selected hierarchy
            filters = {"state_code": state_code}
            if district_code != "0":
                filters["district_code"] = district_code
            if subdistrict_code != "0":
                filters["subdistrict_code"] = subdistrict_code
            
            
            locations = PopulationData.objects.filter(**filters).exclude(village_code=0)
            if locations.exists():
                location_list = [{"code": "0", "name": " ALL"}] + [
                    {"code": loc.village_code, "name": f"{loc.region_name}"} for loc in locations
                ]
            else:
                location_list = [{"code": "", "name": "No villages found"}]
            return JsonResponse(location_list, safe=False)

            

        elif state_code and district_code and subdistrict_code and village_code:
            # Fetch the population of the selected village OR the entire subdistrict if "ALL" is selected
            if village_code == "0":
                # Fetch total population of the subdistrict
                population = PopulationDataYear.objects.filter(
                    state_code=state_code,
                    district_code=district_code,
                    subdistrict_code=subdistrict_code
                ).values_list('population_2011', flat=True).first()
            else:
                # Fetch population of the selected village
                population = PopulationData.objects.filter(
                    state_code=state_code,
                    district_code=district_code,
                    subdistrict_code=subdistrict_code,
                    village_code=village_code
                ).values_list('population_2011', flat=True).first()
            
            if population is None:
                return JsonResponse({"error": "Population data not found."}, status=404)

            return JsonResponse({"population_2011": population}, safe=False)


        
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)
    
    # Invalid request
    return JsonResponse({"error": "Invalid parameters or hierarchy."}, status=400)

def get_village_population(request):
    state_code = request.GET.get('state_code')
    district_code = request.GET.get('district_code')
    subdistrict_code = request.GET.get('subdistrict_code')
    village_codes_param = request.GET.get('village_codes', '')

    # Ensure required parameters are provided
    if not (state_code and district_code):
        return JsonResponse({"error": "Missing required state or district parameter."}, status=400)

    # Split village_codes and filter out any empty strings
    village_codes = [code.strip() for code in village_codes_param.split(',') if code.strip() != '']
    population_data = []

    # Build filters. Normally we filter by subdistrict_code,
    # but if subdistrict_code is "0" (meaning "ALL") and the user has selected specific village codes (not "0"),
    # then remove the subdistrict filter so that each village is looked up by its actual subdistrict.
    filters = {
        "state_code": state_code,
        "district_code": district_code,
    }
    if subdistrict_code != "0":
        filters["subdistrict_code"] = subdistrict_code
    else:
        # if village_codes does not include "0" (which indicates the "ALL" option)
        if village_codes and "0" not in village_codes:
            # Do not add a subdistrict filter so that the lookup will use each village's actual subdistrict.
            pass
        else:
            filters["subdistrict_code"] = subdistrict_code

    for code in village_codes:
        village = PopulationData.objects.filter(**filters, village_code=code).first()
        if village:
            population_data.append({
                'name': village.region_name,
                'population_2011': village.population_2011
            })

    return JsonResponse({'population_data': population_data})


