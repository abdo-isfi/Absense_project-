import React, { useState } from "react";
import PropTypes from "prop-types";
import "./AbsenceCalendar.css";

const AbsenceCalendar = ({ attendanceData }) => {
    const [currentDate, setCurrentDate] = useState(new Date());

    const getDaysInMonth = (year, month) => {
        return new Date(year, month + 1, 0).getDate();
    };

    const getFirstDayOfMonth = (year, month) => {
        return new Date(year, month, 1).getDay(); // 0 for Sunday, 1 for Monday, etc.
    };

    const renderCalendarDays = () => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const numDays = getDaysInMonth(year, month);
        const firstDay = getFirstDayOfMonth(year, month); // 0 = Sunday

        const days = [];

        // Fill leading empty days
        for (let i = 0; i < firstDay; i++) {
            days.push(
                <div key={`empty-${i}`} className="calendar-day empty"></div>
            );
        }

        // Fill actual days
        for (let day = 1; day <= numDays; day++) {
            const dateKey = `${year}-${String(month + 1).padStart(
                2,
                "0"
            )}-${String(day).padStart(2, "0")}`;
            const status = attendanceData[dateKey] || "present";

            // Check if it's Sunday (0)
            const date = new Date(year, month, day);
            const isSunday = date.getDay() === 0; // 0 = Sunday

            // Add 'sunday' class if it's Sunday
            let dayClass = `calendar-day ${status}`;
            if (isSunday) {
                dayClass += " sunday";
            }

            days.push(
                <div key={`day-${day}`} className={dayClass}>
                    {day}
                </div>
            );
        }

        return days;
    };

    const goToPreviousMonth = () => {
        setCurrentDate((prevDate) => {
            const newDate = new Date(prevDate);
            newDate.setMonth(prevDate.getMonth() - 1);
            return newDate;
        });
    };

    const goToNextMonth = () => {
        setCurrentDate((prevDate) => {
            const newDate = new Date(prevDate);
            newDate.setMonth(prevDate.getMonth() + 1);
            return newDate;
        });
    };

    return (
        <div className="absence-calendar">
            <div className="calendar-header">
                <button onClick={goToPreviousMonth} aria-label="Mois précédent">
                    &lt;
                </button>
                <h2>
                    {currentDate.toLocaleDateString("fr-FR", {
                        month: "long",
                        year: "numeric",
                    })}
                </h2>
                <button onClick={goToNextMonth} aria-label="Mois suivant">
                    &gt;
                </button>
            </div>
            <div className="calendar-grid">
                <div className="calendar-weekday">Dim</div>
                <div className="calendar-weekday">Lun</div>
                <div className="calendar-weekday">Mar</div>
                <div className="calendar-weekday">Mer</div>
                <div className="calendar-weekday">Jeu</div>
                <div className="calendar-weekday">Ven</div>
                <div className="calendar-weekday">Sam</div>
                {renderCalendarDays()}
            </div>

            {/* Legend */}
            <div className="calendar-legend">
                <h4>Légende:</h4>
                <div className="legend-items">
                    <div className="legend-item">
                        <div className="legend-color present"></div>
                        <span>Présent</span>
                    </div>
                    <div className="legend-item">
                        <div className="legend-color absent"></div>
                        <span>Absent</span>
                    </div>
                    <div className="legend-item">
                        <div className="legend-color late"></div>
                        <span>Retard</span>
                    </div>
                    <div className="legend-item">
                        <div className="legend-color justified"></div>
                        <span>Justifié</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

AbsenceCalendar.propTypes = {
    attendanceData: PropTypes.object.isRequired,
};

export default AbsenceCalendar;
