const DISPLAY_WIDTH = 64;
const DISPLAY_HEIGHT = 32;
const Chip8_PROGRAM_START = 0x200;

const FONT_SET = [
    0xf0, 0x90, 0x90, 0x90, 0xf0,//0
    0x20, 0x60, 0x20, 0x20, 0x70,//1
    0xf0, 0x10, 0xf0, 0x80, 0xf0,//2
    0xf0, 0x10, 0xf0, 0x10, 0xf0,//3
    0x90, 0x90, 0xf0, 0x10, 0x10,//4
    0xf0, 0x80, 0xf0, 0x10, 0xf0,//5
    0xf0, 0x80, 0xf0, 0x90, 0xf0,//6
    0xf0, 0x10, 0x20, 0x40, 0x40,//7
    0xf0, 0x90, 0xf0, 0x90, 0xf0,//8
    0xf0, 0x90, 0xf0, 0x10, 0xf0,//9
    0xf0, 0x90, 0xf0, 0x90, 0x90,//A
    0xe0, 0x90, 0xe0, 0x90, 0xe0,//B
    0xf0, 0x80, 0x80, 0x80, 0xf0,//C
    0xe0, 0x90, 0x90, 0x90, 0xe0,//D
    0xf0, 0x80, 0xf0, 0x80, 0xf0,//E
    0xf0, 0x80, 0xf0, 0x80, 0x80,//F
]
const INST_SET = [
    { type: "00E0", pattern: 0x00e0, mask: 0xffff, args: [] },
    { type: "00EE", pattern: 0x00ee, mask: 0xffff, args: [] },
    { type: "0nnn", pattern: 0x0000, mask: 0xf000, args: [{ mask: 0x0fff, shift: 0, type: 'addr' }] },
    { type: "1nnn", pattern: 0x1000, mask: 0xf000, args: [{ mask: 0x0fff, shift: 0, type: 'addr' }] },
    { type: "2nnn", pattern: 0x2000, mask: 0xf000, args: [{ mask: 0x0fff, shift: 0, type: 'addr' }] },
    { type: "3xkk", pattern: 0x3000, mask: 0xf000, args: [{ mask: 0x0f00, shift: 8, type: 'vx' }, { mask: 0x00ff, shift: 0, type: 'kk' }] },
    { type: "4xkk", pattern: 0x4000, mask: 0xf000, args: [{ mask: 0x0f00, shift: 8, type: 'vx' }, { mask: 0x00ff, shift: 0, type: 'kk' }] },
    { type: "5xy0", pattern: 0x5000, mask: 0xf00f, args: [{ mask: 0x0f00, shift: 8, type: 'vx' }, { mask: 0x00f0, shift: 4, type: 'vy' }] },
    { type: "6xkk", pattern: 0x6000, mask: 0xf000, args: [{ mask: 0x0f00, shift: 8, type: 'vx' }, { mask: 0x00ff, shift: 0, type: 'kk' }] },
    { type: "7xkk", pattern: 0x7000, mask: 0xf000, args: [{ mask: 0x0f00, shift: 8, type: 'vx' }, { mask: 0x00ff, shift: 0, type: 'kk' }] },
    { type: "8xy0", pattern: 0x8000, mask: 0xf00f, args: [{ mask: 0x0f00, shift: 8, type: 'vx' }, { mask: 0x00f0, shift: 4, type: 'vy' }] },
    { type: "8xy1", pattern: 0x8001, mask: 0xf00f, args: [{ mask: 0x0f00, shift: 8, type: 'vx' }, { mask: 0x00f0, shift: 4, type: 'vy' }] },
    { type: "8xy2", pattern: 0x8002, mask: 0xf00f, args: [{ mask: 0x0f00, shift: 8, type: 'vx' }, { mask: 0x00f0, shift: 4, type: 'vy' }] },
    { type: "8xy3", pattern: 0x8003, mask: 0xf00f, args: [{ mask: 0x0f00, shift: 8, type: 'vx' }, { mask: 0x00f0, shift: 4, type: 'vy' }] },
    { type: "8xy4", pattern: 0x8004, mask: 0xf00f, args: [{ mask: 0x0f00, shift: 8, type: 'vx' }, { mask: 0x00f0, shift: 4, type: 'vy' }] },
    { type: "8xy5", pattern: 0x8005, mask: 0xf00f, args: [{ mask: 0x0f00, shift: 8, type: 'vx' }, { mask: 0x00f0, shift: 4, type: 'vy' }] },
    { type: "8xy6", pattern: 0x8006, mask: 0xf00f, args: [{ mask: 0x0f00, shift: 8, type: 'vx' }, { mask: 0x00f0, shift: 4, type: 'vy' }] },
    { type: "8xy7", pattern: 0x8007, mask: 0xf00f, args: [{ mask: 0x0f00, shift: 8, type: 'vx' }, { mask: 0x00f0, shift: 4, type: 'vy' }] },
    { type: "8xyE", pattern: 0x800e, mask: 0xf00f, args: [{ mask: 0x0f00, shift: 8, type: 'vx' }, { mask: 0x00f0, shift: 4, type: 'vy' }] },
    { type: "9xy0", pattern: 0x9000, mask: 0xf00f, args: [{ mask: 0x0f00, shift: 8, type: 'vx' }, { mask: 0x00f0, shift: 4, type: 'vy' }] },
    { type: "Annn", pattern: 0xa000, mask: 0xf000, args: [{ mask: 0x0fff, shift: 0, type: 'addr' }] },
    { type: "Bnnn", pattern: 0xb000, mask: 0xf000, args: [{ mask: 0x0fff, shift: 0, type: 'addr' }] },
    { type: "Cxkk", pattern: 0xc000, mask: 0xf000, args: [{ mask: 0x0f00, shift: 8, type: 'vx' }, { mask: 0x00ff, shift: 0, type: 'kk' }] },
    { type: "Dxyn", pattern: 0xd000, mask: 0xf000, args: [{ mask: 0x0f00, shift: 8, type: 'vx' }, { mask: 0x00f0, shift: 4, type: 'vy' }, { mask: 0x000f, shift: 0, type: 'n' }] },
    { type: "Ex9E", pattern: 0xe09e, mask: 0xf0ff, args: [{ mask: 0x0f00, shift: 8, type: 'vx' },] },
    { type: "ExA1", pattern: 0xe0a1, mask: 0xf0ff, args: [{ mask: 0x0f00, shift: 8, type: 'vx' },] },
    { type: "Fx07", pattern: 0xf007, mask: 0xf00f, args: [{ mask: 0x0f00, shift: 8, type: 'vx' }] },
    { type: "Fx0A", pattern: 0xf00a, mask: 0xf00f, args: [{ mask: 0x0f00, shift: 8, type: 'vx' }] },
    { type: "Fx15", pattern: 0xf015, mask: 0xf0ff, args: [{ mask: 0x0f00, shift: 8, type: 'vx' }] },
    { type: "Fx18", pattern: 0xf018, mask: 0xf0ff, args: [{ mask: 0x0f00, shift: 8, type: 'vx' }] },
    { type: "Fx1E", pattern: 0xf01e, mask: 0xf0ff, args: [{ mask: 0x0f00, shift: 8, type: 'vx' }] },
    { type: "Fx29", pattern: 0xf029, mask: 0xf0ff, args: [{ mask: 0x0f00, shift: 8, type: 'vx' }] },
    { type: "Fx33", pattern: 0xf033, mask: 0xf0ff, args: [{ mask: 0x0f00, shift: 8, type: 'vx' }] },
    { type: "Fx55", pattern: 0xf055, mask: 0xf0ff, args: [{ mask: 0x0f00, shift: 8, type: 'vx' }] },
    { type: "Fx65", pattern: 0xf065, mask: 0xf0ff, args: [{ mask: 0x0f00, shift: 8, type: 'vx' }] },
    { type: "DW", pattern: 0x0000, mask: 0x0000, args: [{ mask: 0xffff, shift: 0, type: 'DW' }] },
]
