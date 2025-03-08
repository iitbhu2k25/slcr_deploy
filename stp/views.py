from django.conf import settings
from django.views.decorators.csrf import csrf_exempt
from django.http import JsonResponse
from django.shortcuts import render
import json
import os 
import geopandas as gpd
from .models import Village,District,SubDistrict,State
from shapely.geometry import mapping
from .service import weight_redisturb,normalize_data,rank_process,process_geometries
def stp_home(request):
    return render(request, 'stp/prediction.html')

@csrf_exempt
def GetStatesView(request):
    states=State.objects.values('state_short','state_name')
    states=[{'id': state['state_short'],'name':state['state_name']} for state in states]
    return JsonResponse(list(states),safe=False)

@csrf_exempt
def GetDistrictView(request):
    if request.method == 'POST':
        state_id=json.loads(request.body).get('state')
        districts=District.objects.values('district_name').filter(state_short=state_id).order_by('district_name')
        districts=[{'id': district['district_name'],'name':district['district_name']} for district in districts]
        return JsonResponse(list(districts),safe=False)

@csrf_exempt
def GetSubDistrictView(request):
    if request.method == 'POST':
        district_name=(json.loads(request.body).get('districts'))
        SubDistricts=list(SubDistrict.objects.values('subdistrict_name').filter(district_name__in=district_name).order_by('subdistrict_name'))
        SubDistricts=[{'id': SubDistrict['subdistrict_name'],'name':SubDistrict['subdistrict_name']} for SubDistrict in SubDistricts]
        return JsonResponse(list(SubDistricts),safe=False)

@csrf_exempt
def  GetVillageView(request):
    if request.method == 'POST':
        print("in the villages is ",json.loads(request.body))
        SubDistrict_name=(json.loads(request.body).get('subDistricts'))
        villages=list(Village.objects.values('village_name').filter(subdistrict__in=SubDistrict_name))
        villages=[{'id': village['village_name'],'name':village['village_name']} for village in villages]
        return JsonResponse(list(villages),safe=False)

@csrf_exempt
def GetVaruna(request):
    if request.method=='GET':
        try:
            print("try nto take the varuna")
            shapefile_path = os.path.join(settings.BASE_DIR, 'media','Rajat_data','shape_stp','tempy','Priority.shp')
            gdf = gpd.read_file(shapefile_path)
            if gdf.crs is None or gdf.crs.to_epsg() != 4326:
                gdf = gdf.to_crs(epsg=4326) 
            geojson_data = json.loads(gdf.to_json())
            print("staring sedn bakcen shpe file")
            return JsonResponse(geojson_data, safe=False)
        except Exception as e:
            print("error is", str(e))
            return JsonResponse({'error': str(e)}, status=500)


@csrf_exempt
def GetBoundry(request):
    if request.method == 'GET':
        try:
            print("try to get all the polygon")
            shapefile_path = os.path.join(settings.BASE_DIR, 'media','Rajat_data','shape_stp','state','state.shp')
            gdf = gpd.read_file(shapefile_path)
            if gdf.crs is None or gdf.crs.to_epsg() != 4326:
                gdf = gdf.to_crs(epsg=4326) 
            geojson_data = json.loads(gdf.to_json())
            print("staring sedn bakcen shpe file")
            return JsonResponse(geojson_data, safe=False)
            
        except Exception as e:
            print("error is", str(e))
            return JsonResponse({'error': str(e)}, status=500)
        
    if request.method == 'POST':
        try:
            # Read the shapefile
            request_data = json.loads(request.body)

            try:
                if request_data.get('villages'):
                    villages_name=request_data.get('villages')
                    shapefile_path = os.path.join(settings.BASE_DIR, 'media', 'Rajat_data', 'shape_stp', 'villages', 'Basin_Village_PCS.shp')
                    gdf = gpd.read_file(shapefile_path)
                    if gdf.crs is None or gdf.crs.to_epsg() != 4326:
                        gdf = gdf.to_crs(epsg=4326)
                    filtered_gdf = gdf[(gdf['NAME_1'].isin(villages_name))]
                    geojson_data = json.loads(filtered_gdf.to_json())
                    return JsonResponse(geojson_data, safe=False)
                
                elif request_data.get('subDistrictNames'):   
                    District_name=request_data.get('districtNames')
                    state_code=request_data.get('stateId')         
                    subDistricts=request_data.get('subDistrictNames')
                    shapefile_path = os.path.join(settings.BASE_DIR, 'media', 'Rajat_data', 'shape_stp', 'subdistrict', 'subdistrict_updated.shp')
                    gdf = gpd.read_file(shapefile_path)
                    if gdf.crs is None or gdf.crs.to_epsg() != 4326:
                        gdf = gdf.to_crs(epsg=4326)
                    filtered_gdf = gdf[(gdf['state_name'] == state_code) & (gdf['dist_name'].isin(District_name)) & gdf['subdis_nam'].isin(subDistricts)]
                    geojson_data = json.loads(filtered_gdf.to_json())
                    return JsonResponse(geojson_data, safe=False)
                
                elif request_data.get('districtNames'):
                    District_name=request_data.get('districtNames')
                    state_code=request_data.get('stateId')
                    shapefile_path = os.path.join(settings.BASE_DIR, 'media', 'Rajat_data', 'shape_stp', 'district', 'district.shp')
                    gdf = gpd.read_file(shapefile_path)
                    if gdf.crs is None or gdf.crs.to_epsg() != 4326:
                        gdf = gdf.to_crs(epsg=4326)
                    filtered_gdf = gdf[(gdf['State'] == state_code) & (gdf['District'].isin(District_name))]
                    geojson_data = json.loads(filtered_gdf.to_json())
                    return JsonResponse(geojson_data, safe=False)
                
                else :
                    state_code=request_data.get('stateId')
                    print("stateId in polygons is ",state_code)
                    shapefile_path = os.path.join(settings.BASE_DIR, 'media', 'Rajat_data', 'shape_stp', 'state', 'state.shp')
                    gdf = gpd.read_file(shapefile_path)
                    if gdf.crs is None or gdf.crs.to_epsg() != 4326:
                        gdf = gdf.to_crs(epsg=4326)
                    filtered_gdf = gdf[gdf['State'] == state_code]  
                    geojson_data = json.loads(filtered_gdf.to_json())
                    return JsonResponse(geojson_data, safe=False)
                
            except Exception as e:
                print(f"Error filtering or processing data: {str(e)}")
                return JsonResponse({'error': 'Error processing geographic data'}, status=500)
                
        except Exception as e:
            print(f"Error reading shapefile or processing request: {str(e)}")
            return JsonResponse({'error': str(e)}, status=500)
        
@csrf_exempt
def GetVillage_UP(request):
    try:
        try:
            request_data = json.loads(request.body)
            villages_list=request_data.get('village_name')
        except json.JSONDecodeError:
            return JsonResponse({'error': 'Invalid JSON data'}, status=400)
        try:
            gdf = gpd.read_file('media/shapefile/villages/Basin_Villages.shp')

        except Exception as e:
            print('erris is ',str(e))
            return JsonResponse({'error': 'Error reading geographic data'}, status=500)

        # Filter geodataframe
        print("village_list",villages_list)
        filtered_gdf = gdf[gdf['NAME_1'].isin(villages_list)]
        print("filtered_gdf",filtered_gdf)
        coordinates = process_geometries(filtered_gdf)
        print("coor",coordinates)
        if not coordinates:
            return JsonResponse({'error': 'Failed to extract valid coordinates'}, status=500)

        if len(coordinates) > 1:
            coordinates = [coordinates]

        return JsonResponse({'coordinates': coordinates})

    except Exception as e:
        return JsonResponse({'error': 'Internal server error'}, status=500)


@csrf_exempt
def GetTableView(request):
    if request.method == 'POST':
        request=json.loads(request.body)
        main_data=request.get('main_data')
        vig_data=main_data['villages']
        table_id=[]
        for i in vig_data:
            table_id.append(int(i[8:]))
        categories=request.get('categories')
        ans=Data.objects.values('name',*categories).filter(id__in=table_id)
        ans=list(ans)
        for i in ans:
            print(i)
        return JsonResponse(ans,safe=False)
    
@csrf_exempt
def GetRankView(request):
    if request.method == 'POST':
        request=json.loads(request.body)
        table_data=request.get('tableData')
        headings=[]
        for i in table_data[0]:
            headings.append(i)        
        headings.remove('name')
        weight_key=weight_redisturb(headings)
        table_data=normalize_data(table_data)
        ans=rank_process(table_data,weight_key,headings)
        print('main ans',ans)
        return JsonResponse(ans,safe=False)
