import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const DAYS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
const TIME_SLOTS = ['08:30-11:00', '11:00-13:30', '13:30-16:00', '16:00-18:30'];

/**
 * Export timetable to PDF
 * @param {Object} teacher - Teacher information
 * @param {Array} sessions - Array of session objects
 */
export const exportToPDF = (teacher, sessions) => {
  const doc = new jsPDF('landscape');
  
  // Minimal Header
  doc.setFontSize(14);
  doc.setTextColor(40, 40, 40);
  doc.text(`Emploi du Temps - ${teacher.firstName} ${teacher.lastName}`, 14, 15);
  
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const academicYear = month >= 8 ? `${year}-${year + 1}` : `${year - 1}-${year}`;
  doc.text(`Année: ${academicYear} | Généré le: ${now.toLocaleDateString('fr-FR')}`, 14, 22);
  
  // Helper function to get session for a day/time slot
  const getSession = (day, timeSlot) => {
    // First check for exact match
    const exactMatch = sessions.find(s => s.day === day && s.timeSlot === timeSlot);
    if (exactMatch) return exactMatch;
    
    // Check if this slot is part of a merged session
    const mergedSession = sessions.find(s => {
      if (s.isMerged && s.day === day && s.originalSlots) {
        return s.originalSlots[0] === timeSlot; // Return session if this is the first slot
      }
      return false;
    });
    
    return mergedSession || null;
  };

  // Check if a cell should be rendered (not part of a merged session)
  const shouldRenderCell = (day, timeSlot) => {
    for (const session of sessions) {
      if (session.isMerged && session.day === day && session.originalSlots) {
        // Only render the first slot of the merged session
        if (session.originalSlots.includes(timeSlot)) {
          return session.originalSlots[0] === timeSlot;
        }
      }
    }
    return true;
  };
  
  // Prepare table data
  const tableData = DAYS.map(day => {
    const row = [day];
    TIME_SLOTS.forEach(timeSlot => {
      if (!shouldRenderCell(day, timeSlot)) {
        return; // Skip cells that are part of merged sessions
      }

      const session = getSession(day, timeSlot);
      if (session) {
        const groupName = session.group?.name || session.group;
        const subject = session.subject ? `${session.subject}\n` : ''; // Only show subject if exists
        
        // Create cell object with content and custom properties
        const cellContent = {
          content: `${subject}${groupName}\nSalle: ${session.room}\n\n`, // Extra newlines for badges
          colSpan: session.isMerged && session.originalSlots ? session.originalSlots.length : 1,
          styles: {
            halign: 'center', // Center content
            valign: 'middle'
          },
          // Custom data for drawing badges
          _session: {
            type: session.type,
            mode: session.mode || 'Présentiel'
          }
        };
        
        row.push(cellContent);
      } else {
        row.push('-');
      }
    });
    return row;
  });
  
  // Create table
  autoTable(doc, {
    startY: 25, // Start higher up
    head: [['Jour', ...TIME_SLOTS]],
    body: tableData,
    theme: 'grid',
    styles: {
      fontSize: 10,
      cellPadding: 2,
      overflow: 'linebreak',
      halign: 'center',
      valign: 'middle',
      minCellHeight: 20
    },
    headStyles: {
      fillColor: [41, 128, 185],
      textColor: 255,
      fontStyle: 'bold',
      halign: 'center',
      minCellHeight: 10
    },
    columnStyles: {
      0: { fontStyle: 'bold', fillColor: [236, 240, 241], halign: 'left', cellWidth: 25 },
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245],
    },
    didParseCell: function(data) {
      // Color code session types (Background)
      if (data.section === 'body' && data.column.index > 0 && data.cell.raw && data.cell.raw._session) {
        const type = data.cell.raw._session.type;
        const mode = data.cell.raw._session.mode;
        
        if (type === 'Cours') {
          data.cell.styles.fillColor = [219, 234, 254]; // Blue-100
        } else if (type === 'TD') {
          data.cell.styles.fillColor = [220, 252, 231]; // Green-100
        } else if (type === 'TP') {
          data.cell.styles.fillColor = [243, 232, 255]; // Purple-100
        }
        
        // Add border for remote sessions
        if (mode === 'À distance') {
          data.cell.styles.lineWidth = 0.5;
          data.cell.styles.lineColor = [147, 51, 234]; // Purple border
        }
      }
    },
    didDrawCell: function(data) {
      if (data.section === 'body' && data.column.index > 0 && data.cell.raw && data.cell.raw._session) {
        const { type, mode } = data.cell.raw._session;
        const cell = data.cell;
        const doc = data.doc;
        
        const badgeHeight = 4;
        const badgeWidth = 10;
        const badgeY = cell.y + cell.height - badgeHeight - 2;
        
        // Calculate center position for badges
        const cellCenter = cell.x + (cell.width / 2);
        const totalBadgesWidth = 10 + 2 + 5; // Type width + gap + Mode width
        const startX = cellCenter - (totalBadgesWidth / 2);
        
        // Draw Type Badge
        let typeColor = [59, 130, 246]; // Blue default
        if (type === 'TD') typeColor = [34, 197, 94]; // Green
        if (type === 'TP') typeColor = [168, 85, 247]; // Purple
        
        doc.setFillColor(...typeColor);
        doc.roundedRect(startX, badgeY, badgeWidth, badgeHeight, 1, 1, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(6);
        doc.text(type, startX + (badgeWidth/2), badgeY + 3, { align: 'center' });
        
        // Draw Mode Badge
        let modeColor = [34, 197, 94]; // Green (Présentiel)
        let modeText = 'P';
        if (mode === 'À distance') {
          modeColor = [168, 85, 247]; // Purple
          modeText = 'D';
        }
        
        doc.setFillColor(...modeColor);
        doc.roundedRect(startX + badgeWidth + 2, badgeY, 5, badgeHeight, 1, 1, 'F');
        doc.setTextColor(255, 255, 255);
        doc.text(modeText, startX + badgeWidth + 2 + 2.5, badgeY + 3, { align: 'center' });
        
        // Reset text color for next cells
        doc.setTextColor(60, 60, 60);
      }
    }
  });
  
  // Footer
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Page ${i} sur ${pageCount}`,
      doc.internal.pageSize.width / 2,
      doc.internal.pageSize.height - 10,
      { align: 'center' }
    );
  }
  
  // Statistics - displayed horizontally at bottom
  const finalY = doc.lastAutoTable.finalY + 10;
  if (finalY < doc.internal.pageSize.height - 30) {
    const totalSessions = sessions.length;
    // Calculate total hours including merged sessions
    const totalHours = sessions.reduce((total, session) => {
      if (session.isMerged && session.originalSlots) {
        return total + (session.originalSlots.length * 2.5);
      }
      return total + 2.5;
    }, 0).toFixed(1);
    
    const sessionsByType = sessions.reduce((acc, s) => {
      acc[s.type] = (acc[s.type] || 0) + 1;
      return acc;
    }, {});
    
    // Display all statistics on one line
    doc.setFontSize(9);
    doc.setTextColor(60, 60, 60);
    const statsText = `Total seances: ${totalSessions}  |  Total heures: ${totalHours}h  |  Cours: ${sessionsByType.Cours || 0} | TD: ${sessionsByType.TD || 0} | TP: ${sessionsByType.TP || 0}`;
    doc.text(statsText, 14, finalY);
  }
  
  // Save PDF
  const fileName = `Emploi_du_temps_${teacher.lastName}_${teacher.firstName}.pdf`;
  doc.save(fileName);
};
