import {Component} from '@angular/core';
import {FilterComponent} from "../filter/filter.component";
import {FilterMultipleValues} from "../../../services/results.service";

@Component({
    selector: 'text',
    templateUrl: './text.component.html',
    styleUrls: ['./text.component.scss']
})
export class TextComponent extends FilterComponent {

    values: string[] = [];


    onFilterSet() {


    }


    filterChange(e) {
        if (e.event.target.checked) {
            this.addToValues(e.value);
        } else {
            this.removeFromValues(e.value);
        }

        this.onFilterChange.emit({
            type: 'multiple',
            field: this.filter.field,
            selected: this.values.length > 0,
            values: this.values,
        });
    }

    addToValues(value: string) {
        if (this.values.indexOf(value) < 0) {
            this.values.push(value);
        }
    }

    removeFromValues(value) {
        this.values = this.values.filter((x) => x !== value);
    }
}