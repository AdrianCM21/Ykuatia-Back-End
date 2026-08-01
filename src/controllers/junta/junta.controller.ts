import { Request, Response } from 'express';
import {
  clearJuntaLogo,
  getJuntaConfig,
  setJuntaLogo,
  toPublicJunta,
  updateJuntaConfig,
} from '../../services/junta/junta.service';
import { createInvoiceFromBoletas } from '../../services/facturas/pdf.service';
import { pdfToBuffer } from '../../utils/pdfBuffer';
import { buildPreviewBoletas } from '../../utils/boletaData';
import { normalizeBoletasPorPagina } from '../../utils/boletaPapel';
import { registrarEvento } from '../../services/auditoria/eventosAuditoria.service';

export const getJuntaController = async (_req: Request, res: Response) => {
  try {
    const config = await getJuntaConfig();
    res.json(toPublicJunta(config));
  } catch (error) {
    res.status(400).json({
      message: error instanceof Error ? error.message : 'Error al obtener configuración',
    });
  }
};

export const updateJuntaController = async (req: Request, res: Response) => {
  try {
    const config = await updateJuntaConfig(req.body);
    await registrarEvento({
      idUsuario: req.user?.id,
      accion: 'junta.actualizar',
      entidad: 'configuracion_junta',
      entidadId: config.id,
      detalle: { version: config.version },
    });
    res.json(toPublicJunta(config));
  } catch (error) {
    res.status(400).json({
      message: error instanceof Error ? error.message : 'Error al actualizar configuración',
    });
  }
};

export const uploadLogoController = async (req: Request, res: Response) => {
  try {
    const tipo = (req.body.tipo || req.query.tipo || 'principal') as 'principal' | 'secundario';
    if (!['principal', 'secundario'].includes(tipo)) {
      res.status(400).json({ message: 'tipo debe ser principal o secundario' });
      return;
    }
    if (!req.file) {
      res.status(400).json({ message: 'Debés subir una imagen' });
      return;
    }
    const relativePath = `/uploads/junta/${req.file.filename}`;
    const config = await setJuntaLogo(tipo, relativePath);
    res.json(toPublicJunta(config));
  } catch (error) {
    res.status(400).json({
      message: error instanceof Error ? error.message : 'Error al subir logo',
    });
  }
};

export const deleteLogoController = async (req: Request, res: Response) => {
  try {
    const tipo = (req.query.tipo || req.body?.tipo || 'principal') as 'principal' | 'secundario';
    if (!['principal', 'secundario'].includes(tipo)) {
      res.status(400).json({ message: 'tipo debe ser principal o secundario' });
      return;
    }
    const config = await clearJuntaLogo(tipo);
    res.json(toPublicJunta(config));
  } catch (error) {
    res.status(400).json({
      message: error instanceof Error ? error.message : 'Error al eliminar logo',
    });
  }
};

export const boletaPreviewController = async (req: Request, res: Response) => {
  try {
    const draft = req.body || {};
    const plantilla = String(draft.plantilla_boleta || 'clasica').toLowerCase();
    const count =
      plantilla === 'basica' ? normalizeBoletasPorPagina(draft.boletas_por_pagina) : 1;
    const boletas = buildPreviewBoletas(count);
    const pdfDoc = await createInvoiceFromBoletas(boletas, draft);
    const buffer = await pdfToBuffer(pdfDoc);

    res.setHeader('Content-Type', 'application/pdf');
    // inline: pensado para vista previa en el navegador, no forzar descarga
    res.setHeader('Content-Disposition', 'inline; filename="boleta-preview.pdf"');
    res.setHeader('Content-Length', String(buffer.length));
    res.end(buffer);
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: error instanceof Error ? error.message : 'Error al generar preview',
    });
  }
};
