import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";
import { TDocumentDefinitions, Content, StyleDictionary } from 'pdfmake/interfaces';
import { IDataPdf } from "../../interfaces/facturas/pdf";
import { Factura } from "../../models/db-models/facturas";

pdfMake.vfs = pdfFonts.pdfMake.vfs;

const styles:StyleDictionary = {
    header: {
        fontSize: 18,
        bold: true,
        margin: [0, 0, 0, 10]
    },
    subheader: {
        fontSize: 16,
        bold: true,
        margin: [0, 10, 0, 5]
    },
    tableExample: {
        margin: [0, 5, 0, 15]
    },
}

const inicio = (): Content[] => {
    return [
        { text: 'VOLETA DE AGUA', style: 'header', margin: [0, 10, 0, 0], alignment: 'center' },
        { text: 'Junta de saneamiento Barrio Barana', style: 'subheader', alignment: 'center' },
    ];
};

const generarEncabezado = (nombre:string,direccion:string):Content => {
    return {
        table: {
            widths: ['*', '*'],
            body: [
                [
                    {
                        stack: [
                            { text: 'Detalles de la empresa', style: 'subheader', margin: [0, 10, 0, 0] },
                            { text: 'Nombre de la Empresa: Junta de saneamiento', margin: [0, 5, 0, 0] },
                            { text: 'Direccion: barrio barana', margin: [0, 5, 0, 0] },
                            { text: 'Direccion: Itapua poty', margin: [0, 5, 0, 0] },
                            { text: 'Telefono: 0985 484848', margin: [0, 5, 0, 0] },
                        ],
                        margin: [0, 0, 10, 20]
                    },
                    {
                        stack: [
                            { text: 'Detalles del cliente', style: 'subheader', margin: [0, 10, 0, 0] },
                            { text: `Nombre: ${nombre}`, margin: [0, 5, 0, 0] },
                            { text: `Direccion: ${direccion}`, margin: [0, 5, 0, 0] }
                        ],
                        margin: [10, 0, 0, 20]
                    }
                ]
            ]
        },
        layout: 'noBorders'
    };
};


const generarDetallesFactura= (nombre: string):Content => {
    return {
        table: {
            widths: ['*', '*', '*', '*'],
            body: [
                [
                    { text: 'Detalles de la Factura', style: 'header', colSpan: 3, alignment: 'center' }, {}, {}, {}
                ],
                [ 
                    { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 1 }] , colSpan: 4 }, 
                    {}, {}, {}
                ],
                [
                    { text: `Factura`, margin: [0, 5, 0, 0] },
                    { text: `Fecha de Factura: ${new Date().toLocaleDateString()}`, margin: [0, 5, 0, 0] },
                    {
                        text: `Fecha de Vencimiento: ${new Date(new Date().setDate(new Date().getDate() + 14)).toLocaleDateString()}`,
                        margin: [0, 5, 0, 0]
                    },
                    { },
                ]
            ]
        },
        layout: 'noBorders',
        margin: [0, 0, 0, 20]
    };
};

const generarDetallesProductos = (facturas: Factura[]): Content => {

    const body = [
        [
            { text: 'Fecha de Emisión', style: 'tableHeader', bold: true },
            { text: 'Monto', style: 'tableHeader', bold: true },
            { text: 'Total', style: 'tableHeader', bold: true }
        ],
        ...facturas.map(factura => [
            new Date(factura.Fecha_emicion).toLocaleString('es-ES', { month: 'long' }),
            `${Number(factura.monto)} Gs`,
            `${Number(factura.monto)} Gs`
        ]),
        [{ text: 'Total', bold: true }, '', { text: `${facturas.reduce((sum, factura) => sum + Number(factura.monto), 0)} Gs`, bold: true }]
    ];

    return {
        style: 'tableExample',
        table: {
            widths: ['*', '*', '*'],
            body: body
        }
    };
};

const generateLine= ():Content => {
    return{
        canvas: [
            {
                type: 'line',
                x1: 0,
                y1: 0,
                x2: 515, // Ancho de la línea. Ajusta este valor según el ancho de tu página.
                y2: 0,
                lineWidth: 1
            }
        ],
        margin: [0, 10, 0, 0] // Ajusta el margen según dónde quieras que aparezca la línea en la página.
    }
}

const generarFooter = (): Content => {
    return {
        text: 'El agua es un tesoro, no lo desperdicies',
        style: 'subheader',
        alignment: 'center',
        margin: [0, 20, 0, 20]
    };
};


export const createInvoice = async(data:IDataPdf[]) => {
    try {


        const content:Content = data.map((item:IDataPdf)=>{
            return [
                generateLine(),
                inicio(),
                generarEncabezado(item.cliente.nombre,item.cliente.direccion),
                generarDetallesFactura(item.cliente.nombre),
                generarDetallesProductos(item.facturas),
                generateLine(),
                generarFooter(),
                generateLine(),
                
                { text: '', pageBreak: 'after' } 
            ]

        })

        
        const docDefinition:TDocumentDefinitions = {
            content: content,
            styles: styles,
        };
    
        const pdfDoc = await pdfMake.createPdf(docDefinition);
    
        return pdfDoc
    } catch (error) {
        throw error
    }
    
}
