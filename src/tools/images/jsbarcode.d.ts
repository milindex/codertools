declare module 'jsbarcode' {
  export type JsBarcodeFormat =
    | 'CODE128'
    | 'EAN13'
    | 'EAN8'
    | 'UPC'
    | 'CODE39'
    | 'ITF14'
    | 'MSI'
    | 'pharmacode'
    | 'codabar';

  export type JsBarcodeOptions = {
    format?: JsBarcodeFormat | string;
    width?: number;
    height?: number;
    displayValue?: boolean;
    text?: string;
    fontOptions?: string;
    font?: string;
    textAlign?: 'left' | 'center' | 'right';
    textPosition?: 'top' | 'bottom';
    textMargin?: number;
    fontSize?: number;
    background?: string;
    lineColor?: string;
    margin?: number;
    marginTop?: number;
    marginBottom?: number;
    marginLeft?: number;
    marginRight?: number;
    valid?: (valid: boolean) => void;
  };

  export type JsBarcodeTarget =
    SVGSVGElement | HTMLCanvasElement | HTMLImageElement | string;

  interface JsBarcodeStatic {
    (target: JsBarcodeTarget, data: string, options?: JsBarcodeOptions): void;
  }

  const JsBarcode: JsBarcodeStatic;
  export default JsBarcode;
}
