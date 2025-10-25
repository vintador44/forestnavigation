module.exports = class UserDto {
    id;
    password;
    email;
    fio;

    constructor(model) {
        this.id = model.ID;
        this.password = model.Password;
        this.email = model.Email;
        this.fio = model.FIO;
    }
}
