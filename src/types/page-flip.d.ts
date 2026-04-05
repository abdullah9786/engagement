declare module "page-flip" {
  export class PageFlip {
    constructor(container: HTMLElement, settings: Record<string, unknown>);
    loadFromHTML(pages: NodeListOf<Element> | HTMLElement[]): void;
    flipNext(corner?: string): void;
    flipPrev(corner?: string): void;
    flip(pageNum: number, corner?: string): void;
    getCurrentPageIndex(): number;
    getPageCount(): number;
    getOrientation(): string;
    destroy(): void;
    on(event: string, callback: (e: { data: number | string }) => void): this;
  }
}
