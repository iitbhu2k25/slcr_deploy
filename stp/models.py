from django.db import models

class State(models.Model):
    state_code = models.IntegerField() 
    state_name = models.CharField(max_length=30)
    state_short=models.CharField(max_length=5)

    class Meta:
        app_label = 'stp'

    def __str__(self):
        return f"{self.state_name}"


class District(models.Model):
    district_code = models.IntegerField()
    district_name = models.CharField(max_length=30)
    state_short=models.CharField(max_length=5)

    class Meta:
        app_label = 'stp'

    def __str__(self):
        return f"{self.district_name}"


class SubDistrict(models.Model):
    subdistrict_code = models.IntegerField()
    subdistrict_name = models.CharField(max_length=100)
    district_name=models.CharField(max_length=100)
    state_short=models.CharField(max_length=30)

    class Meta:
        app_label = 'stp'

    def __str__(self):
        return f"{self.subdistrict_name}"


class Village(models.Model):  # Changed from Villages to Village
    subdistrict=models.CharField(max_length=100)
    village_name=models.CharField(max_length=100)
    population=models.IntegerField()
    sewage=models.FloatField(default=0)
    Subdistric=models.IntegerField()
    class Meta:
        app_label = 'stp'

    def __str__(self):  # Added __str__ method for better readability
        return f"{self.village_name}, {self.subdistrict.subdistrict_name}"


class Weight(models.Model):
    sewage_gap = models.FloatField()
    mean_temperature = models.FloatField()
    mean_rainfall = models.FloatField()
    number_of_tourists = models.FloatField()
    water_quality_index = models.FloatField()
    number_of_asi_sites = models.FloatField()
    gdp_at_current_prices = models.FloatField()

    class Meta:
        app_label = 'stp'
        
    def __str__(self):  # Added __str__ method for better readability
        return f"Weight configuration #{self.id}"