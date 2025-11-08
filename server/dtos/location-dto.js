module.exports = class LocationDto {
    id;
    locationName;
    coordinates;
    description;
    categories;

    constructor(model) {
        this.id = model.ID;
        this.locationName = model.LocationName;
        this.coordinates = model.Coordinates;
        this.description = model.Description;
        this.categories = model.Categories;
    }
}
