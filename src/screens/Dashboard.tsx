// (Questo è un NUOVO file)

import React from 'react';

export const Dashboard: React.FC = () => {
  return (
    <div className="w-full min-h-screen p-8 flex flex-col items-center">
      <div className="w-full max-w-4xl">
        <h1 className="text-4xl font-bold text-gray-800 mb-6">
          I tuoi Progressi
        </h1>

        <div className="p-6 bg-white rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Statistiche</h2>
          <p className="text-gray-600">
            Questa sezione mostrerà grafici e statistiche sulla tua precisione,
            le serie completate e la tua "streak" giornaliera.
          </p>
          {/* Esempio di contenuto placeholder */}
          <div className="mt-6 p-4 bg-gray-100 rounded">
            (Contenuto progressi in arrivo...)
          </div>
        </div>
      </div>
    </div>
  );
};