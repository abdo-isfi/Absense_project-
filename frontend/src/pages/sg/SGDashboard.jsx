import React, { useState, useEffect, useCallback } from "react";
import api from "../../services/api";
import Card from "../../components/ui/Card";
import { 
  UserGroupIcon, 
  AcademicCapIcon, 
  UsersIcon, 
  ClipboardDocumentListIcon, 
  BellAlertIcon  
} from "@heroicons/react/24/outline";



export default function SGDashboard() {
    const [stats, setStats] = useState({
        teachersCount: 0,
        traineesCount: 0,
        totalAbsences: 0,
        recentAbsences: 0,
        groupsCount: 0,
    });
    const [traineesData, setTraineesData] = useState([]);
    const [filtersApplied, setFiltersApplied] = useState(false);
    const [absenceRecordsData, setAbsenceRecordsData] = useState([]);
    const [availableGroups, setAvailableGroups] = useState([]);
    const [selectedGroup, setSelectedGroup] = useState("");
    const [pendingGroup, setPendingGroup] = useState("");
    const [showAllClassesAbsence, setShowAllClassesAbsence] = useState(false);
    const [groupStats, setGroupStats] = useState({
        totalTrainees: 0,
        totalAbsenceHours: 0,
        disciplinaryActions: {},
    });

    const [topAbsentTrainees, setTopAbsentTrainees] = useState([]);
    const [disciplinaryChartData, setDisciplinaryChartData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [allClassesAbsenceStats, setAllClassesAbsenceStats] = useState([]);

    const daysAgo = useCallback((days) => {
        const d = new Date();
        d.setDate(d.getDate() - days);
        return d;
    }, []);

    const getTraineeStatus = useCallback((hours) => {
        const deducted = Math.floor(hours / 5);
        let status;

        if (deducted === 0) status = "NORMAL";
        else if (deducted === 1) status = "1er AVERT (SC)";
        else if (deducted === 2) status = "2ème AVERT (SC)";
        else if (deducted === 3) status = "1er MISE (CD)";
        else if (deducted === 4) status = "2ème MISE (CD)";
        else if (deducted === 5) status = "BLÂME (CD)";
        else if (deducted === 6) status = "SUSP 2J (CD)";
        else if (deducted >= 7 && deducted <= 10) status = "EXCL TEMP (CD)";
        else status = "EXCL DEF (CD)";

        return { text: status };
    }, []);

    const getDisciplinaryColor = (status) => {
        const colors = {
            NORMAL: "#9FE855",
            "1er AVERT (SC)": "#235a8c",
            "2ème AVERT (SC)": "#191E46",
            "1er MISE (CD)": "#8784b6",
            "2ème MISE (CD)": "#8784b6",
            "BLÂME (CD)": "#8B4513",
            "SUSP 2J (CD)": "#FEAE00",
            "EXCL TEMP (CD)": "#FEAE00",
            "EXCL DEF (CD)": "#FF0000",
        };
        return colors[status] || "#2ecc71";
    };

    const calculateGroupStats = useCallback(
        (trainees, absenceRecords, groupName) => {
            const groupTrainees = trainees.filter(
                (t) => (t.groupe || t.class)?.trim().toLowerCase() === groupName.trim().toLowerCase()
            );

            let totalAbsenceHours = 0;
            const disciplinaryActions = {
                NORMAL: 0,
                "1er AVERT (SC)": 0,
                "2ème AVERT (SC)": 0,
                "1er MISE (CD)": 0,
                "2ème MISE (CD)": 0,
                "BLÂME (CD)": 0,
                "SUSP 2J (CD)": 0,
                "EXCL TEMP (CD)": 0,
                "EXCL DEF (CD)": 0,
            };

            const allTraineesInGroup = [];

            groupTrainees.forEach((trainee) => {
                const cef = trainee.cef;
                let traineeHours = 0;

                absenceRecords.forEach((record) => {
                    if (!record.trainee_absences || !Array.isArray(record.trainee_absences)) return;

                    record.trainee_absences.forEach((ta) => {
                        // Check if this absence belongs to the trainee
                        // Backend returns populated trainee object in ta.trainee
                        const absenceCef = ta.trainee?.cef || ta.cef;
                        
                        if (
                            absenceCef === cef &&
                            ta.status === "absent" &&
                            ta.is_validated === true &&
                            !ta.is_justified
                        ) {
                            const hours = parseFloat(ta.absence_hours || 5);
                            traineeHours += hours;
                        }
                    });
                });

                totalAbsenceHours += traineeHours;

                const status = getTraineeStatus(traineeHours).text;

                allTraineesInGroup.push({
                    ...trainee,
                    absenceHours: Math.round(traineeHours * 10) / 10,
                    status,
                });

                if (disciplinaryActions[status] !== undefined) {
                    disciplinaryActions[status]++;
                }
            });

            allTraineesInGroup.sort((a, b) => b.absenceHours - a.absenceHours);

            setTopAbsentTrainees(allTraineesInGroup);
            setGroupStats({
                totalTrainees: groupTrainees.length,
                totalAbsenceHours: Math.round(totalAbsenceHours * 10) / 10,
                disciplinaryActions,
            });

            const formattedLabels = Object.keys(disciplinaryActions).map(
                (key) => {
                    return `${key} (${disciplinaryActions[key]})`;
                }
            );

            setDisciplinaryChartData({
                labels: formattedLabels,
                datasets: [
                    {
                        data: Object.values(disciplinaryActions),
                        backgroundColor: [
                            "#9FE855",
                            "#235a8c",
                            "#191E46",
                            "#8784b6",
                            "#8784b6",
                            "#8B4513",
                            "#FEAE00",
                            "#FEAE00",
                            "#FF0000",
                        ],
                        borderWidth: 1,
                    },
                ],
            });
        },
        [getTraineeStatus]
    );

    const loadFromLocalStorage = useCallback(() => {
        try {
            const teachers = JSON.parse(
                localStorage.getItem("formateurs") || "[]"
            );
            const trainees = JSON.parse(
                localStorage.getItem("traineesData") || "[]"
            );

            const groups = [
                ...new Set(
                    trainees.map((t) => t.class || t.GROUPE).filter(Boolean)
                ),
            ].sort();

            setAvailableGroups(groups);
            const groupToSelect = groups.length > 0 ? groups[0] : "";
            setSelectedGroup(groupToSelect);
            setPendingGroup(groupToSelect);

            setStats({
                teachersCount: teachers.length,
                traineesCount: trainees.length,
                totalAbsences: 0,
                recentAbsences: 0,
                groupsCount: groups.length,
            });

            setError("Données chargées depuis le cache (API inaccessible)");
        } catch (e) {
            console.error("LocalStorage load failed:", e);
            setError("Impossible de charger les données locales.");
        }
    }, []);

    useEffect(() => {
        if (
            selectedGroup &&
            traineesData.length > 0 &&
            absenceRecordsData.length > 0
        ) {
            calculateGroupStats(
                traineesData,
                absenceRecordsData,
                selectedGroup
            );
        }
    }, [selectedGroup, traineesData, absenceRecordsData, calculateGroupStats]);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // Fetch with high limits to ensure we get all data for the dashboard
                const [teachersRes, traineesRes, absencesRes] =
                    await Promise.all([
                        api.get("/teachers?limit=1000").catch(() => ({ data: [] })),
                        api.get("/trainees?limit=1000").catch(() => ({ data: [] })),
                        api.get("/absences").catch(() => ({ data: [] })),
                    ]);

                // Handle response structure (some endpoints return { data: [...], pagination: ... })
                const teachers = teachersRes.data.data || (Array.isArray(teachersRes.data) ? teachersRes.data : []);
                const trainees = traineesRes.data.data || (Array.isArray(traineesRes.data) ? traineesRes.data : []);
                const absenceRecords = absencesRes.data.data || (Array.isArray(absencesRes.data) ? absencesRes.data : []);

                setTraineesData(trainees);
                setAbsenceRecordsData(absenceRecords);

                // Extract unique groups from trainees
                const groups = [
                    ...new Set(
                        trainees
                            .map((t) => t.groupe || t.class)
                            .filter(Boolean)
                    ),
                ].sort();
                setAvailableGroups(groups);
                
                // Select first group if available and none selected
                if (!selectedGroup && groups.length > 0) {
                    setPendingGroup(groups[0]);
                }

                // Calculate Global Stats
                let totalAbsences = 0;
                let recentAbsences = 0;
                const sevenDaysAgo = daysAgo(7);

                absenceRecords.forEach((record) => {
                    if (record.trainee_absences && Array.isArray(record.trainee_absences)) {
                        record.trainee_absences.forEach((ta) => {
                            if (ta.status === "absent" && ta.is_validated === true) {
                                totalAbsences++;
                                const recordDate = new Date(record.date);
                                if (recordDate >= sevenDaysAgo) {
                                    recentAbsences++;
                                }
                            }
                        });
                    }
                });

                setStats({
                    teachersCount: teachers.length,
                    traineesCount: trainees.length,
                    totalAbsences,
                    recentAbsences,
                    groupsCount: groups.length,
                });

                // Calculate Absences per Class
                const classAbsenceMap = {};
                trainees.forEach((trainee) => {
                    const groupName = trainee.groupe || trainee.class;
                    if (groupName) {
                        if (!classAbsenceMap[groupName]) {
                            classAbsenceMap[groupName] = 0;
                        }
                        const cef = trainee.cef;
                        
                        absenceRecords.forEach((record) => {
                            if (record.trainee_absences && Array.isArray(record.trainee_absences)) {
                                record.trainee_absences.forEach((ta) => {
                                    // Check if this absence belongs to the trainee
                                    // Backend returns populated trainee object in ta.trainee
                                    const absenceCef = ta.trainee?.cef || ta.cef;
                                    
                                    if (
                                        absenceCef === cef &&
                                        ta.status === "absent" &&
                                        ta.is_validated === true &&
                                        !ta.is_justified
                                    ) {
                                        const hours = parseFloat(ta.absence_hours || 5);
                                        classAbsenceMap[groupName] += hours;
                                    }
                                });
                            }
                        });
                    }
                });

                const sortedClasses = Object.entries(classAbsenceMap)
                    .map(([name, totalAbsenceHours]) => ({
                        name,
                        totalAbsenceHours: Math.round(totalAbsenceHours * 10) / 10,
                    }))
                    .sort((a, b) => b.totalAbsenceHours - a.totalAbsenceHours);

                setAllClassesAbsenceStats(sortedClasses);

                if (selectedGroup) {
                    calculateGroupStats(trainees, absenceRecords, selectedGroup);
                }
            } catch (err) {
                console.error("API failed:", err);
                setError("Erreur lors du chargement des données. Veuillez réessayer.");
                loadFromLocalStorage();
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [calculateGroupStats, daysAgo, loadFromLocalStorage]);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin h-10 w-10 border-4 border-primary-600 border-t-transparent rounded-full" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-gray-900">📊 Tableau de Bord</h1>
                <p className="text-gray-600 mt-2">
                    Vue d'ensemble des formateurs, stagiaires et absences
                </p>
            </div>

            {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-lg border border-red-200 text-center font-medium mb-6">
                    {error}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6 mb-8">
                <Card className="border-l-4 border-l-green-500 flex flex-col items-center justify-center text-center min-h-[160px] p-6">
                    <div className="bg-green-50 p-4 rounded-full mb-3 flex items-center justify-center">
                        <AcademicCapIcon className="h-8 w-8 text-green-600" />
                    </div>
                    <div className="text-3xl font-bold text-gray-900 mb-1">{stats.teachersCount}</div>
                    <div className="text-sm font-medium text-gray-500">Formateurs</div>
                </Card>
                <Card className="border-l-4 border-l-blue-500 flex flex-col items-center justify-center text-center min-h-[160px] p-6">
                    <div className="bg-blue-50 p-4 rounded-full mb-3 flex items-center justify-center">
                        <UsersIcon className="h-8 w-8 text-blue-600" />
                    </div>
                    <div className="text-3xl font-bold text-gray-900 mb-1">{stats.traineesCount}</div>
                    <div className="text-sm font-medium text-gray-500">Stagiaires</div>
                </Card>
                <Card className="border-l-4 border-l-purple-500 flex flex-col items-center justify-center text-center min-h-[160px] p-6">
                    <div className="bg-purple-50 p-4 rounded-full mb-3 flex items-center justify-center">
                        <UserGroupIcon className="h-8 w-8 text-purple-600" />
                    </div>
                    <div className="text-3xl font-bold text-gray-900 mb-1">{stats.groupsCount}</div>
                    <div className="text-sm font-medium text-gray-500">Groupes</div>
                </Card>
                <Card className="border-l-4 border-l-orange-500 flex flex-col items-center justify-center text-center min-h-[160px] p-6">
                    <div className="bg-orange-50 p-4 rounded-full mb-3 flex items-center justify-center">
                        <ClipboardDocumentListIcon className="h-8 w-8 text-orange-600" />
                    </div>
                    <div className="text-3xl font-bold text-gray-900 mb-1">{stats.totalAbsences}</div>
                    <div className="text-sm font-medium text-gray-500">Absences Totales</div>
                </Card>
                <Card className="border-l-4 border-l-red-500 flex flex-col items-center justify-center text-center min-h-[160px] p-6">
                    <div className="bg-red-50 p-4 rounded-full mb-3 flex items-center justify-center">
                        <BellAlertIcon className="h-8 w-8 text-red-600" />
                    </div>
                    <div className="text-3xl font-bold text-gray-900 mb-1">{stats.recentAbsences}</div>
                    <div className="text-sm font-medium text-gray-500">7 derniers jours</div>
                </Card>
            </div>

            {availableGroups.length > 0 ? (
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-wrap items-center gap-4 mb-8">
                    <label className="font-semibold text-gray-900 whitespace-nowrap">Sélectionner un groupe :</label>
                    <select
                        value={pendingGroup}
                        onChange={(e) => setPendingGroup(e.target.value)}
                        className="flex-1 min-w-[200px] p-2.5 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                    >
                        <option value="">Choisissez un groupe</option>
                        {availableGroups.map((g) => (
                            <option key={g} value={g}>
                                {g}
                            </option>
                        ))}
                    </select>
                    <button
                        className="bg-primary-600 text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-primary-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
                        onClick={() => {
                            if (pendingGroup) {
                                setSelectedGroup(pendingGroup);
                                setFiltersApplied(true);
                            } else {
                                setSelectedGroup("");
                                setFiltersApplied(false);
                            }
                        }}
                        disabled={!pendingGroup}
                    >
                        🔍 Filtrer
                    </button>
                </div>
            ) : (
                <div className="text-center p-8 bg-gray-50 rounded-xl border border-dashed border-gray-300 text-gray-500 italic mb-8">
                    Aucun groupe trouvé.
                </div>
            )}

            {filtersApplied ? (
                selectedGroup ? (
                    <div className="space-y-8">
                        <div className="flex flex-wrap gap-6">
                            <div className="flex-1 min-w-[220px] bg-gray-50 p-6 rounded-xl border border-gray-200 text-center shadow-sm hover:-translate-y-1 transition-transform">
                                <strong className="block text-2xl font-bold text-gray-900 mb-1">{groupStats.totalTrainees}</strong>
                                <span className="text-gray-600">stagiaires</span>
                            </div>
                            <div className="flex-1 min-w-[220px] bg-gray-50 p-6 rounded-xl border border-gray-200 text-center shadow-sm hover:-translate-y-1 transition-transform">
                                <strong className="block text-2xl font-bold text-gray-900 mb-1">{groupStats.totalAbsenceHours}</strong>
                                <span className="text-gray-600">heures d'absence</span>
                            </div>
                        </div>

                        <Card header="État Disciplinaire" className="w-full">
                            <div className="space-y-4">
                                {Object.entries(groupStats.disciplinaryActions).map(([status, count]) => {
                                    const total = Object.values(groupStats.disciplinaryActions).reduce((a, b) => a + b, 0);
                                    const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
                                    
                                    return (
                                        <div key={status} className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <span
                                                        className="w-4 h-4 rounded-full border-2 border-white shadow-sm"
                                                        style={{ backgroundColor: getDisciplinaryColor(status) }}
                                                    ></span>
                                                    <span className="font-medium text-gray-700 text-sm">{status}</span>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <span className="text-sm text-gray-500 font-medium">{percentage}%</span>
                                                    <span className="font-bold text-primary-600 bg-primary-50 px-3 py-1.5 rounded-lg min-w-[45px] text-center text-sm shadow-sm">
                                                        {count}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                                                <div
                                                    className="h-full rounded-full transition-all duration-500 ease-out shadow-sm"
                                                    style={{
                                                        width: `${percentage}%`,
                                                        backgroundColor: getDisciplinaryColor(status)
                                                    }}
                                                ></div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </Card>
                    </div>
                ) : (
                    <div className="text-center p-8 bg-gray-50 rounded-xl border border-dashed border-gray-300 text-gray-500 italic">
                        <p>Aucun groupe sélectionné.</p>
                    </div>
                )
            ) : (
                <div className="text-center p-8 bg-gray-50 rounded-xl border border-dashed border-gray-300 text-gray-500 italic">
                    <p>
                        Veuillez sélectionner un groupe et cliquer sur{" "}
                        <strong>"Filtrer"</strong> pour afficher les statistiques.
                    </p>
                </div>
            )}

            {filtersApplied && selectedGroup && topAbsentTrainees.length > 0 ? (
                <div className="mt-12">
                    <h2 className="text-2xl font-semibold text-gray-900 mb-6 pb-2 border-b border-gray-200">
                        Liste des Stagiaires par Absence
                    </h2>
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">CEF</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Nom</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Prénom</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Heures</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Statut</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {topAbsentTrainees.map((t, i) => (
                                        <tr key={i} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{t.cef || t.CEF}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{t.name || t.NOM || "-"}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{t.first_name || t.PRENOM || "-"}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">{t.absenceHours}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span
                                                    className="px-3 py-1 rounded-full text-xs font-semibold border"
                                                    style={{
                                                        backgroundColor: `${getDisciplinaryColor(t.status)}20`,
                                                        color: getDisciplinaryColor(t.status),
                                                        borderColor: getDisciplinaryColor(t.status),
                                                    }}
                                                >
                                                    {t.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            ) : filtersApplied && selectedGroup && topAbsentTrainees.length === 0 ? (
                <div className="text-center p-8 bg-gray-50 rounded-xl border border-dashed border-gray-300 text-gray-500 italic mt-8">
                    <p>Aucun stagiaire en absence pour ce groupe.</p>
                </div>
            ) : null}

            {allClassesAbsenceStats.length > 0 && (
                <div className="mt-16">
                    <div className="flex justify-between items-center mb-6 pb-2 border-b border-gray-200">
                        <h2 className="text-2xl font-semibold text-gray-900">Absences par Classe</h2>
                        <button
                            onClick={() => setShowAllClassesAbsence((prev) => !prev)}
                            className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0"
                        >
                            {showAllClassesAbsence ? "Masquer" : "Afficher"}
                        </button>
                    </div>
                    
                    {showAllClassesAbsence && (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Classe</th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Heures d'absence totales</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {allClassesAbsenceStats.map((classStats, index) => (
                                            <tr key={index} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">{classStats.name}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{classStats.totalAbsenceHours}h</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
