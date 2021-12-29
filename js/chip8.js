
class Chip8 {
    constructor() {
        this.display = null;
        this.control = null;
        this.audio = null;
        this.reset();
    }

    load_rom(rom_file, cb) {
        this.reset();

        let reader = new FileReader();

        reader.readAsArrayBuffer(rom_file);

        reader.onload = () => {
            let data = new Uint8Array(reader.result);

            //load rom to memory
            this.load_to_memory(data, Chip8_PROGRAM_START);
            cb();
        };

        reader.onerror = () => {
            console.log(reader.error);
        };
    }

    reset() {
        this.M = new Uint8Array(4096);
        this.R = new Uint8Array(16); //reg
        this.S = new Uint16Array(16); //stack 
        this.I = 0;//stores memory addresses
        this.DT = 0; //Delay Timer (8-bit)
        this.ST = 0; //Sound Timer (8-bit)
        this.SP = -1; //Stack Pointer (8-bit) points at topost level of stack
        this.PC = Chip8_PROGRAM_START;   // Most Chip-8 programs start at location 0x200 (512)
        this.halted = false;
        this.soundEnabled = true;
        this.load_to_memory(FONT_SET);
    }


    load_to_memory(dataset, start_from = 0) {
        for (let i = 0; i < dataset.length; i++) {
            this.M[start_from + i] = dataset[i];
        }
    }

    _exec(inst_obj) {
        let { type, opcode, args } = inst_obj;
        //console.log(type, opcode.toString(16), JSON.stringify(args));
        switch (type) {
            case "00E0":   // 00E0 - Clear the display
                this.display.clear(); this._next();
                break;
            case "00EE": // 00EE - Return from a subroutine
                if (this.SP === -1) {
                    this.halted = true
                    throw new Error('Stack underflow.')
                }

                this.PC = this.S[this.SP]
                this.SP--;
                break;
            case "1nnn":  // 1nnn - Jump to location nnn
                this.PC = args[0]
                break
            case "2nnn": // 2nnn - Call subroutine at nnn
                if (this.SP === 15) {
                    this.halted = true
                    throw new Error('Stack overflow.')
                }

                this.SP++
                this.S[this.SP] = this.PC + 2
                this.PC = args[0]
                break
            case "3xkk": // 3xnn - Skip next instruction if Vx = nn
                (this.R[args[0]] === args[1]) ? this._skip() : this._next();
                break;
            case "4xkk":
                // 4xnn - Skip next instruction if Vx != nn
                (this.R[args[0]] !== args[1]) ? this._skip() : this._next();
                break;
            case "5xy0":
                // 5xy0 - Skip next instruction if Vx = Vy
                (this.R[args[0]] === this.R[args[1]]) ? this._skip() : this._next();
                break;
            case "6xkk":
                // 6xnn - Set Vx = nn
                this.R[args[0]] = args[1]; this._next();
                break;
            case "7xkk":
                // 7xnn - Set Vx = Vx + nn
                let v = this.R[args[0]] + args[1]
                if (v > 255) {
                    v -= 256
                }
                this.R[args[0]] = v
                this._next();
                break;
            case "8xy0":
                // 8xy0 - Set Vx = Vy
                this.R[args[0]] = this.R[args[1]];
                this._next()
                break;
            case "8xy1": // 8xy1 - Set Vx = Vx OR Vy
                this.R[args[0]] |= this.R[args[1]];
                this._next();
                break;
            case "8xy2":  // 8xy2 - Set Vx = Vx AND Vy
                this.R[args[0]] &= this.R[args[1]]
                this._next(); break;
            case "8xy3":  // 8xy3 - Set Vx = Vx XOR Vy
                this.R[args[0]] ^= this.R[args[1]]
                this._next(); break;
            case "8xy4":   // 8xy4 - Set Vx = Vx + Vy, set VF = carry
                this.R[0xf] = this.R[args[0]] + this.R[args[1]] > 0xff ? 1 : 0
                this.R[args[0]] += this.R[args[1]]
                this._next(); break;
            case "8xy5":   // 8xy5 - Set Vx = Vx - Vy, set VF = NOT borrow
                this.R[0xf] = this.R[args[0]] > this.R[args[1]] ? 1 : 0
                this.R[args[0]] -= this.R[args[1]]

                this._next();
                break;
            case "8xy6":   // 8xy6 - Set Vx = Vx SHR 1
                this.R[0xf] = this.R[args[0]] & 1
                this.R[args[0]] >>= 1
                this._next(); break;
            case "8xy7": // 8xy7 - Set Vx = Vy - Vx, set VF = NOT borrow
                this.R[0xf] = this.R[args[1]] > this.R[args[0]] ? 1 : 0

                this.R[args[0]] = this.R[args[1]] - this.R[args[0]]
                this._next(); break;
            case "8xyE": // 8xyE - Set Vx = Vx SHL 1
                this.R[0xf] = this.R[args[0]] >> 7

                this.R[args[0]] <<= 1
                this._next(); break;
            case "9xy0":  // 9xy0 - Skip next instruction if Vx != Vy
                (this.R[args[0]] !== this.R[args[1]]) ? this._skip() : this._next();
                break;
            case "Annn":  // Annn - Set I = nnn
                this.I = args[0]
                this._next(); break;
            case "Bnnn":    // Bnnn - Jump to location nnn + V0
                this.PC = this.R[0] + args[1]; break;
            case "Cxkk": // Cxnn - Set Vx = random byte AND nn
                let random = Math.floor(Math.random() * 0xff)
                this.R[args[0]] = random & args[1]
                this._next(); break;
            case "Dxyn":

                // Dxyn - Display n-byte sprite starting at memory location I at (Vx, Vy), set VF = collision
                if (this.I > 4095 - args[2]) {
                    this.halted = true
                    throw new Error('Memory out of bounds.')
                }

                // If no pixels are erased, set VF to 0
                this.R[0xf] = 0

                // The interpreter reads n bytes from memory, starting at the address stored in I
                for (let i = 0; i < args[2]; i++) {
                    let line = this.M[this.I + i]
                    // Each byte is a line of eight pixels
                    for (let position = 0; position < 8; position++) {
                        // Get the byte to set by position
                        let value = line & (1 << (7 - position)) ? 1 : 0
                        // If this causes any pixels to be erased, VF is set to 1
                        let x = (this.R[args[0]] + position) % DISPLAY_WIDTH // wrap around width
                        let y = (this.R[args[1]] + i) % DISPLAY_HEIGHT // wrap around height

                        if (this.display.set(x, y, value)) {
                            this.R[0xf] = 1
                        }
                    }
                }

                this._next()
                break;
            case "Ex9E":
                // Ex9E - Skip next instruction if key with the value of Vx is pressed
                (this.control.getKeys() & (1 << this.R[args[0]])) ? this._skip() : this._next();
                break;
            case "ExA1":
                // ExA1 - Skip next instruction if key with the value of Vx is not pressed
                (!(this.control.getKeys() & (1 << this.R[args[0]]))) ? this._skip() : this._next();
                break;
            case "Fx07":    // Fx07 - Set Vx = delay timer value
                this.R[args[0]] = this.DT
                this._next(); break;
            case "Fx0A": // Fx0A - Wait for a key press, store the value of the key in Vx
                const keyPress = this.control.waitKey()

                if (!keyPress) {
                    return
                }

                this.R[args[0]] = keyPress
                this._next(); break;
            case "Fx15": // Fx15 - Set delay timer = Vx
                this.DT = this.R[args[0]]
                this._next(); break;
            case "Fx18":   // Fx18 - Set sound timer = Vx
                this.ST = this.R[args[0]]
                if (this.ST > 0) {
                    this.soundEnabled = true
                    this.audio.enableSound()
                }
                this._next(); break;
            case "Fx1E":   // Fx1E - Set I = I + Vx
                this.I = this.I + this.R[args[0]]
                this._next();
                break;
            case "Fx29":// Fx29 - Set I = location of sprite for digit Vx
                if (this.R[args[0]] > 0xf) {
                    this.halted = true
                    throw new Error('Invalid digit.')
                }

                this.I = this.R[args[0]] * 5
                this._next(); break;
            case "Fx33":   // Fx33 - Store BCD representation of Vx in memory locations I, I+1, and I+2
                // BCD means binary-coded decimal
                // If VX is 0xef, or 239, we want 2, 3, and 9 in I, I+1, and I+2
                if (this.I > 4093) {
                    this.halted = true
                    throw new Error('Memory out of bounds.')
                }

                let x = this.R[args[0]]
                const a = Math.floor(x / 100) // for 239, a is 2
                x = x - a * 100 // subtract value of a * 100 from x (200)
                const b = Math.floor(x / 10) // x is now 39, b is 3
                x = x - b * 10 // subtract value of b * 10 from x (30)
                const c = Math.floor(x) // x is now 9

                this.M[this.I] = a
                this.M[this.I + 1] = b
                this.M[this.I + 2] = c

                this._next(); break;
            case "Fx55":// Fx55 - Store registers V0 through Vx in memory starting at location I
                if (this.I > 4095 - args[0]) {
                    this.halted = true
                    throw new Error('Memory out of bounds.')
                }

                for (let i = 0; i <= args[0]; i++) {
                    this.M[this.I + i] = this.R[i]
                }

                this._next(); break;
            case "Fx65": // Fx65 - Read registers V0 through Vx from memory starting at location I
                if (this.I > 4095 - args[0]) {
                    this.halted = true
                    throw new Error('Memory out of bounds.')
                }

                for (let i = 0; i <= args[0]; i++) {
                    this.R[i] = this.M[this.I + i]
                }

                this._next(); break;
            default:
                this.halted = true
                throw new Error('Illegal instruction.')
        }
    }

    _next() {
        this.PC += 2;
    }
    _skip() {
        this.PC += 4;
    }

    tick() {
        if (this.DT > 0) {
            // Decrement the delay timer by one until it reaches zero
            this.DT--
        }

        if (this.ST > 0) {
            // The sound timer is active whenever the sound timer register (ST) is non-zero.
            this.ST--
        } else {
            // When ST reaches zero, the sound timer deactivates.
            if (this.soundEnabled) {
                this.audio.disableSound()
                this.soundEnabled = false
            }
        }
    }

    step() {
        if (this.halted) {
            throw new Error('CPU Stoped');
        }
        const opcode = this._fetch();

        this._exec(new Inst(opcode))
    }

    _fetch() {
        if (this.PC > 4094) {
            this.halted = true;
            throw new Error('Memory out of bounds.')
        }

        return (this.M[this.PC] << 8) | (this.M[this.PC + 1] << 0)
    }
    print_console() {
        let console = document.querySelector(".console");
        console.querySelector(".r").innerHTML = JSON.stringify(this.R);
        console.querySelector(".s").innerHTML = JSON.stringify(this.S);
        console.querySelector(".i").innerHTML = JSON.stringify(this.I);

        console.querySelector(".st").innerHTML = JSON.stringify(this.ST);
        console.querySelector(".dt").innerHTML = JSON.stringify(this.DT);
        console.querySelector(".pc").innerHTML = JSON.stringify(this.PC);
        console.querySelector(".sp").innerHTML = JSON.stringify(this.SP);
    }
}
