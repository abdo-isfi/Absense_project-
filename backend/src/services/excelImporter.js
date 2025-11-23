import xlsx from 'xlsx';
import csvParser from 'csv-parser';
import fs from 'fs';
import Trainee from '../models/Trainee.js';
import Group from '../models/Group.js';

// Header mapping for Excel/CSV import
const headerMap = {
  'cef': 'cef',
  'nom': 'name',
  'prénom': 'firstName',
  'prenom': 'firstName',
  'groupe': 'groupe',
  'class': 'groupe',
  'classe': 'groupe',
  'telephone': 'phone',
  'téléphone': 'phone',
  'tel': 'phone',
  'TELEPHONE': 'phone',
  'TÉLÉPHONE': 'phone',
  'TEL': 'phone',
};

/**
 * Import trainees from Excel file
 * @param {String} filePath - Path to Excel file
 * @returns {Object} - Import results
 */
export const importFromExcel = async (filePath) => {
  try {
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows = xlsx.utils.sheet_to_json(sheet, { header: 1 });

    if (rows.length < 5) {
      throw new Error('Le fichier ne contient pas assez de lignes');
    }

    // Header is on row 4 (index 3)
    const headerRaw = rows[3];
    const header = headerRaw.map(h => {
      const normalized = String(h).trim().toLowerCase();
      return headerMap[normalized] || null;
    });

    const trainees = [];
    const errors = [];

    // Data starts from row 5 (index 4)
    for (let i = 4; i < rows.length; i++) {
      const row = rows[i];
      const data = {};

      header.forEach((field, idx) => {
        if (field && row[idx] !== undefined) {
          data[field] = String(row[idx]).trim();
        }
      });

      // Validate required fields
      if (!data.cef || !data.name || !data.firstName || !data.groupe) {
        errors.push({ row: i + 1, error: 'Champs obligatoires manquants' });
        continue;
      }

      // Create or find group
      const group = await Group.findOneAndUpdate(
        { name: data.groupe },
        { name: data.groupe },
        { upsert: true, new: true }
      );

      trainees.push({
        cef: data.cef,
        name: data.name,
        firstName: data.firstName,
        groupe: group.name,
        phone: data.phone || null,
        groupId: group._id,
      });
    }

    return { trainees, errors };
  } catch (error) {
    throw new Error(`Erreur lors de la lecture du fichier Excel: ${error.message}`);
  }
};

/**
 * Import trainees from CSV file
 * @param {String} filePath - Path to CSV file
 * @returns {Promise<Object>} - Import results
 */
export const importFromCSV = (filePath) => {
  return new Promise((resolve, reject) => {
    const rows = [];
    
    fs.createReadStream(filePath)
      .pipe(csvParser())
      .on('data', (row) => rows.push(row))
      .on('end', async () => {
        try {
          if (rows.length < 4) {
            throw new Error('Le fichier ne contient pas assez de lignes');
          }

          const trainees = [];
          const errors = [];

          // Process rows starting from index 3 (after header rows)
          for (let i = 3; i < rows.length; i++) {
            const row = rows[i];
            const data = {};

            // Map headers
            Object.keys(row).forEach(key => {
              const normalized = key.trim().toLowerCase();
              const field = headerMap[normalized];
              if (field) {
                data[field] = row[key].trim();
              }
            });

            // Validate required fields
            if (!data.cef || !data.name || !data.firstName || !data.groupe) {
              errors.push({ row: i + 1, error: 'Champs obligatoires manquants' });
              continue;
            }

            // Create or find group
            const group = await Group.findOneAndUpdate(
              { name: data.groupe },
              { name: data.groupe },
              { upsert: true, new: true }
            );

            trainees.push({
              cef: data.cef,
              name: data.name,
              firstName: data.firstName,
              groupe: group.name,
              phone: data.phone || null,
              groupId: group._id,
            });
          }

          resolve({ trainees, errors });
        } catch (error) {
          reject(new Error(`Erreur lors du traitement du CSV: ${error.message}`));
        }
      })
      .on('error', (error) => {
        reject(new Error(`Erreur lors de la lecture du fichier CSV: ${error.message}`));
      });
  });
};

/**
 * Save imported trainees to database
 * @param {Array} trainees - Array of trainee objects
 * @returns {Object} - Save results
 */
export const saveTrainees = async (trainees) => {
  let imported = 0;
  const errors = [];

  for (const traineeData of trainees) {
    try {
      const existing = await Trainee.findOne({ cef: traineeData.cef });
      
      if (existing) {
        await existing.updateOne(traineeData);
      } else {
        await Trainee.create(traineeData);
      }
      
      imported++;
    } catch (error) {
      errors.push({
        cef: traineeData.cef,
        error: error.message,
      });
    }
  }

  return { imported, errors };
};
