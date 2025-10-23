module.exports = class UserDto {
    email;
    id;
    is_activated;
    username;

    constructor(model) {
        this.username = model.username;
        this.email = model.email;
        this.id = model.id;

    }
}
