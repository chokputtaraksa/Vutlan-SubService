function Alert(addr, sid, name, state, value, max, la, lw, hw, ha, at0, at75, exp){
    this.addr = addr;
    this.sid = sid;
    this.type =type;
    this.name=name;
    this.min=min;
    this.max=max;
    this.lowAlarm=la;
    this.lowWarning=lw;
    this.highWarning=hw;
    this.highAlarm=ha;
    this.at0=at0;
    this.at75=at75;
    this.expression=exp;
}

module.exports = AnalogSensor;