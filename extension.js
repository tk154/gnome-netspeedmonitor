// NetSpeedMonitor

import { Extension } from 'resource:///org/gnome/shell/extensions/extension.js';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';

import Clutter from 'gi://Clutter';
import St from 'gi://St';

import GLib from 'gi://GLib';


export default class NetSpeedMonitor extends Extension {
    interfaces = [ "enp7s0" ];

    getBytes() {
        let [ bytesDown, bytesUp ] = [ 0, 0 ];

        let contents = GLib.file_get_contents("/proc/net/dev")[1];
        let lines = String.fromCharCode(...contents).split('\n');
    
        for (let i = 2; i < lines.length; i++) {
            let field = lines[i].split(/\s+/);
            let inface = field[0].slice(0, -1);
    
            if (this.interfaces.includes(inface)) {
                bytesDown += parseInt(field[1]);
                bytesUp   += parseInt(field[9]);
            }
        }

        return [ bytesDown, bytesUp ];
    }
    
    refresh() {
        let [ currBytesDown, currBytesUp ] = this.getBytes();
    
        let speedMBitsUp = (currBytesUp - this.bytesUp) * 8 / 1024 / 1024;
        let speedMBitsDown = (currBytesDown - this.bytesDown) * 8 / 1024 / 1024;
    
        this.speedLabel.set_text(
            `U:  ${speedMBitsUp.toFixed(1)} Mb/s\tD:  ${speedMBitsDown.toFixed(1)} Mb/s`
        );
    
        [ this.bytesUp, this.bytesDown ] = [ currBytesUp, currBytesDown ];
    
        return true;
    }

    enable() {
        this.speedLabel = new St.Label({
            y_align: Clutter.ActorAlign.CENTER
        });

        // Add the label to the panel
        Main.panel._rightBox.insert_child_at_index(this.speedLabel, 0);

        [ this.bytesDown, this.bytesUp ] = this.getBytes();

        this.timer = GLib.timeout_add_seconds(
            GLib.PRIORITY_DEFAULT, 1, this.refresh.bind(this)
        );
    }

    disable() {
        GLib.source_remove(this.timer);

        // Remove the added label from panel
        Main.panel._rightBox.remove_child(this.speedLabel);
    }
}
