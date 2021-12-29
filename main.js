
let cpu = new Chip8();

let timer = 0
function cycle() {

    timer++
    if (timer % 5 === 0) {
        cpu.tick()
        timer = 0
    }
    cpu.print_console();
    cpu.step()

    setTimeout(cycle, 3)
}


window.onload = function () {
    cpu.display = new Display(document.querySelector(".display"));
    cpu.control = new Control(document);
    cpu.audio = new Sound();

    let input_read_file = document.querySelector(".rom_loader > input[name='read_file']");
    let btn_read = document.querySelector(".rom_loader > button[name='read']");

    btn_read.onclick = function (e) {
        if (input_read_file.files.length == 0) {
            console.log("File Load: No File");
            return;
        }
        let rom_file = input_read_file.files[0];

        console.log("name: " + rom_file['name']);
        console.log("type: " + rom_file['type']);
        console.log("size: " + rom_file['size']);
        if (rom_file.size <= 0) {
            console.log("File Load: Rom size = 0");
            return;
        }

        cpu.load_rom(rom_file, () => {
            cycle();
        });
    }


}; 