"use client";

import { useState, useEffect } from 'react';
import { useChatbot } from '../context/ChatbotContext';

// Fonction utilitaire pour les badges de phase
const getPhaseBadge = (phase: string) => {
  let colorClass = 'bg-gray-200 text-gray-800';
  switch (phase.toLowerCase()) {
    case 'to do':
      colorClass = 'bg-blue-100 text-blue-800';
      break;
    case 'done':
      colorClass = 'bg-green-100 text-green-800';
      break;
    case 'nrp': // Non Répondu
      colorClass = 'bg-yellow-100 text-yellow-800';
      break;
    case 'fermée perdue':
      colorClass = 'bg-red-100 text-red-800';
      break;
    default:
      break;
  }
  return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClass}`}>{phase}</span>;
};

interface Appointment {
  id: string;
  leadDate: string;
  sales: string;
  contact: string;
  appointmentDate: string;
  appointmentTime: string;
  campaignName: string;
  companyName?: string; // Nouvelle colonne
  appointmentPhase: string;
  transactionPhase: string;
  price: string;
}

interface GroupedAppointments {
  [salesName: string]: Appointment[];
}

export default function Home() {
  const [groupedAppointments, setGroupedAppointments] = useState<GroupedAppointments>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { openChatbotWithAppointment } = useChatbot();

  const handleAppointmentClick = (appointment: Appointment) => {
    openChatbotWithAppointment(appointment);
  };

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const response = await fetch('/api/get-sheet');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const result = await response.json();
        const rawData = result.data;

        if (!rawData || rawData.length === 0) {
          setGroupedAppointments({});
          setLoading(false);
          return;
        }

        const headers = rawData[0];
        const appointments: Appointment[] = rawData.slice(1).map((row: string[]) => {
          const obj: Partial<Appointment> = {};
          headers.forEach((header: string, index: number) => {
            // Normaliser les noms d'en-tête pour les clés d'objet
            const key = header
              .replace(/[^a-zA-Z0-9 ]/g, '') // Supprimer les caractères spéciaux
              .replace(/ /g, '') // Supprimer les espaces
              .toLowerCase(); // Mettre en minuscules
            
            // Mapper les noms d'en-tête aux clés de l'interface Appointment
            switch (key) {
              case 'id': obj.id = row[index]; break;
              case 'datedeprisederdvdulead': obj.leadDate = row[index]; break;
              case 'salesms': obj.sales = row[index]; break;
              case 'contact': obj.contact = row[index]; break;
              case 'datedurdv': obj.appointmentDate = row[index]; break;
              case 'heuredurdv': obj.appointmentTime = row[index]; break;
              case 'nomdelacampange': obj.campaignName = row[index]; break;
              case 'nomdelentreprise': obj.companyName = row[index]; break; // Nouvelle colonne
              case 'phasedurdv': obj.appointmentPhase = row[index]; break;
              case 'phasedelatransaction': obj.transactionPhase = row[index]; break;
              case 'prixttc': obj.price = row[index]; break;
              default: break;
            }
          });
          return obj as Appointment;
        });

        const today = new Date();
        today.setHours(0, 0, 0, 0); // Réinitialiser l'heure pour une comparaison de date uniquement

        const filteredAppointments = appointments.filter(app => {
          if (!app.appointmentDate) return false;
          const [day, month, year] = app.appointmentDate.split('/').map(Number);
          const appDate = new Date(year, month - 1, day); // Mois est 0-indexé
          appDate.setHours(0, 0, 0, 0);
          return appDate.getTime() === today.getTime();
        });

        const grouped: GroupedAppointments = filteredAppointments.reduce((acc, app) => {
          if (app.sales) {
            if (!acc[app.sales]) {
              acc[app.sales] = [];
            }
            acc[app.sales].push(app);
          }
          return acc;
        }, {} as GroupedAppointments);

        setGroupedAppointments(grouped);
      } catch (err) {
        console.error("Failed to fetch appointments:", err);
        setError("Impossible de charger les rendez-vous.");
      } finally {
        setLoading(false);
      }
    };

    fetchAppointments();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <p className="text-lg">Chargement des rendez-vous...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <p className="text-lg text-red-500">{error}</p>
      </div>
    );
  }

  const todayFormatted = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

  return (
    <div className="min-h-screen bg-background text-foreground p-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-5xl font-extrabold mb-4 text-center text-foreground">
          Dashboard des Rendez-vous Sales
        </h1>
        <h2 className="text-2xl font-semibold mb-10 text-center text-gray-500">
          Rendez-vous du {todayFormatted}
        </h2>

        {Object.keys(groupedAppointments).length === 0 ? (
          <p className="text-center text-xl text-gray-500 mt-16">Aucun rendez-vous planifié pour aujourd'hui.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {Object.entries(groupedAppointments).map(([salesName, appointments]) => (
              <div key={salesName} className="bg-gradient-to-br from-white to-gray-50 shadow-xl rounded-xl p-6 border border-gray-100 hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300">
                <h3 className="text-2xl font-bold mb-4 text-blue-700">{salesName}</h3>
                <div className="space-y-4">
                  {appointments.map((app, index) => (
                    <div
                      key={index}
                      className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 cursor-pointer hover:bg-blue-50 transition-colors duration-200"
                      onClick={() => handleAppointmentClick(app)}
                    >
                      <p className="text-lg font-semibold text-gray-900">
                        {app.appointmentTime ? `${app.appointmentTime} - ` : ''} {app.contact}
                      </p>
                      {app.companyName && <p className="text-md font-medium text-blue-600 mt-1">Entreprise: {app.companyName}</p>}
                      <div className="mt-2 flex items-center space-x-2">
                        {getPhaseBadge(app.appointmentPhase)}
                        {app.campaignName && <span className="text-xs text-gray-500">Campagne: {app.campaignName}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
