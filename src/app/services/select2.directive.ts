import { Directive, ElementRef, Input, AfterViewInit, OnChanges, SimpleChanges } from '@angular/core';
declare var $: any;

@Directive({
  selector: '[appSelect2]',
  standalone: true
})
export class Select2Directive implements AfterViewInit, OnChanges {

  @Input() options: any[] = [];
  @Input() placeholder: string = 'Select';

  private initialized = false;

  constructor(private el: ElementRef<HTMLSelectElement>) {}

  ngAfterViewInit() {
    this.tryInit();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['options']) {
      this.tryInit();
    }
  }

  private tryInit() {
    setTimeout(() => {
      const selectEl = $(this.el.nativeElement);

      // Only initialize if options exist
      if (selectEl.children('option').length && !this.initialized) {
        selectEl.select2({
          width: '100%',
          placeholder: this.placeholder,
          allowClear: true
        });

        selectEl.on('change', (e: any) => {
          const event = new Event('input', { bubbles: true });
          this.el.nativeElement.value = e.target.value;
          this.el.nativeElement.dispatchEvent(event);
        });

        this.initialized = true;
      }
    }, 50); // small delay ensures Angular finished rendering
  }
}
