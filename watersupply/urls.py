from django.urls import path
from . import views

urlpatterns = [
    path('', views.main_page, name='watersupply_home'),
    path("waterdemand/get_locations/", views.get_locations, name="get_locations"),
    path("waterdemand/get_village_population/", views.get_village_population, name="get_village_population"),

]
