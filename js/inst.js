
class Inst {
    constructor(opcode) {
        this.opcode = opcode;
        let { inst, args } = this.parse_inst(opcode);
        this.type = inst.type;
        this.inst = inst;
        this.args = args;
    }

    parse_inst(opcode) {
        const inst = INST_SET.find(({ pattern, mask }) => (opcode & mask) === pattern);
        const args = inst.args.map(arg => (opcode & arg.mask) >> arg.shift)
        return { inst, args };
    }

    toJson() {
        return { opcode: this.opcode.toString(16), type: this.type, inst: this.inst, args: this.args }
    }

    toString() {
        return JSON.stringify(this.toJson);
    }

}
