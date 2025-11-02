"use client";

import { useState, useEffect } from 'react';

interface Appointment {
  id: string;
  leadDate: string;
  sales: string;
  contact: string;
  appointmentDate: string;
  appointmentTime: string;
  campaignName: string;
  companyName?: string;
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
              case 'nomdelentreprise': obj.companyName = row[index]; break;
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
      <h1 className="text-4xl font-bold mb-8 text-center">
        Dashboard des Rendez-vous Sales
      </h1>
      <h2 className="text-2xl font-semibold mb-8 text-center text-gray-600">
        Rendez-vous du {todayFormatted}
      </h2>

      {Object.keys(groupedAppointments).length === 0 ? (
        <p className="text-center text-xl text-gray-500">Aucun rendez-vous planifié pour aujourd'hui.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {Object.entries(groupedAppointments).map(([salesName, appointments]) => (
            <div key={salesName} className="bg-white shadow-lg rounded-lg p-6 border border-gray-200">
              <h3 className="text-2xl font-bold mb-4 text-primary-600">{salesName}</h3>
              <div className="space-y-4">
                {appointments.map((app, index) => (
                  <div key={index} className="border-b border-gray-100 pb-4 last:border-b-0 last:pb-0">
                    <p className="text-lg font-semibold text-gray-800">
                      {app.appointmentTime ? `${app.appointmentTime} - ` : ''} {app.contact}
                    </p>
                    <p className="text-sm text-gray-600">Phase: {app.appointmentPhase}</p>
                    {app.campaignName && <p className="text-xs text-gray-500">Campagne: {app.campaignName}</p>}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
