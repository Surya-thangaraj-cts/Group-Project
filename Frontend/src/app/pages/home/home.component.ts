import { Component, AfterViewInit, ElementRef, Renderer2 } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements AfterViewInit {
  constructor(private el: ElementRef, private renderer: Renderer2) {}

  ngAfterViewInit(): void {
    try {
      // generate decorative blobs dynamically
      const decorContainer: HTMLElement = this.el.nativeElement.querySelector('.decor-blobs');
      if (decorContainer) {
        // plenty of blobs; 10 left-biased and 40 general
        for (let i = 0; i < 50; i++) {
          const b = this.renderer.createElement('div');
          this.renderer.addClass(b, 'blob');
          if (i < 14) { // bias some to left
            this.renderer.addClass(b, 'left');
          }
          this.renderer.appendChild(decorContainer, b);
        }
      }

      const aboutContainer: HTMLElement = this.el.nativeElement.querySelector('.about-blobs');
      if (aboutContainer) {
        for (let i = 0; i < 8; i++) {
          const b = this.renderer.createElement('div');
          this.renderer.addClass(b, 'about-blob');
          this.renderer.appendChild(aboutContainer, b);
        }
      }

      const blobs: NodeListOf<HTMLElement> = this.el.nativeElement.querySelectorAll('.decor-blobs .blob, .about-blobs .about-blob');
      if (!blobs || blobs.length === 0) return;

      // Use the home wrapper bounds as reference
      const container = this.el.nativeElement.querySelector('.home-wrapper');

      blobs.forEach((b: HTMLElement) => {
        // tweak appearance based on role/class
        // make blobs generally smaller than before
        let size = 80 + Math.floor(Math.random() * 160); // default size 80-240px
        let left = Math.random() * 100; // percent
        let top = Math.random() * 80; // percent from top
        let opacity = 0.2 + Math.random() * 0.3; // 0.2 - 0.5 (more visible)
        let blur = 24 + Math.floor(Math.random() * 40); // 24 - 64px
        let dur = 8 + Math.floor(Math.random() * 14); // 8 - 22s
        let delay = Math.random() * 6; // stagger

        if (b.classList.contains('left')) {
          // bias left side: keep blobs within left 0-22% of container
          left = Math.random() * 20; // 0 - 20%
          top = 6 + Math.random() * 84; // 6 - 90%
          size = 100 + Math.floor(Math.random() * 180); // smaller left blobs
          opacity = 0.14 + Math.random() * 0.28;
          blur = 26 + Math.floor(Math.random() * 40);
          dur = 10 + Math.floor(Math.random() * 18);
        }

        const aboutParent = b.closest('.about');
        if (b.classList.contains('about-blob') || aboutParent) {
          // confine to about section bounds; use smaller, subtler blobs
          size = 60 + Math.floor(Math.random() * 120); // 60 - 180 smaller about blobs
          left = 6 + Math.random() * 84; // percent within about
          top = 6 + Math.random() * 70;
          opacity = 0.08 + Math.random() * 0.16;
          blur = 18 + Math.floor(Math.random() * 30);
          dur = 8 + Math.floor(Math.random() * 12);
          delay = Math.random() * 4;
        }

        // position blobs; if blob is inside an about section, its containing block is the about element (position: relative set in CSS)
        this.renderer.setStyle(b, 'position', 'absolute');
        this.renderer.setStyle(b, 'pointerEvents', 'none');
        this.renderer.setStyle(b, 'width', `${size}px`);
        this.renderer.setStyle(b, 'height', `${size}px`);
        this.renderer.setStyle(b, 'left', `${left}%`);
        this.renderer.setStyle(b, 'top', `${top}%`);
        this.renderer.setStyle(b, 'opacity', `${opacity}`);
        this.renderer.setStyle(b, 'borderRadius', '50%');
        this.renderer.setStyle(b, 'filter', `blur(${blur}px)`);
        this.renderer.setStyle(b, 'background', `radial-gradient(circle at 30% 30%, rgba(255,70,3,0.26), rgba(255,138,94,0.08))`);
        this.renderer.setStyle(b, 'zIndex', `${b.classList.contains('about-blob') ? '0' : '0'}`);
        this.renderer.setStyle(b, 'transform', 'translate3d(0,0,0)');
        // remove blend mode so blobs are visible on white backgrounds
        // this.renderer.setStyle(b, 'mixBlendMode', 'screen');
        this.renderer.setStyle(b, 'animation', `blobFloat ${dur}s ease-in-out ${delay}s infinite alternate`);
      });
    } catch (e) {
      // if anything fails, silently ignore (non-critical)
    }
    // begin managers/officers typing animation
    try {
      this.animateManagerText();
    } catch {}
  }

  // helper for typing delays
  private sleep(ms: number) {
    return new Promise<void>(resolve => setTimeout(() => resolve(), ms));
  }

  private async animateManagerText() {
    const el: HTMLElement = this.el.nativeElement.querySelector('#anim-text');
    if (!el) return;
    const phrase = 'managers & officers';
    while (true) {
      // type in
      for (let i = 1; i <= phrase.length; i++) {
        this.renderer.setProperty(el, 'textContent', phrase.slice(0, i));
        await this.sleep(90); // slower typing
      }
      await this.sleep(1200); // longer pause after typing
      // delete out
      for (let i = phrase.length; i >= 0; i--) {
        this.renderer.setProperty(el, 'textContent', phrase.slice(0, i));
        await this.sleep(60); // slower deletion
      }
      await this.sleep(800); // longer pause after deleting
    }
  }
  
}
