function Sensor(index, sid, group, module, num, sclass, type, name, state, value, spec){
    this.index = index;
    this.sid = sid;
    // this.group = group;
    this.module = module;
    this.num = parseInt(num);
    this.class = sclass;
    this.type =type;
    this.name=name;
    this.state=state;
    this.value=value;
    // this.spec=spec;
}

module.exports = Sensor;