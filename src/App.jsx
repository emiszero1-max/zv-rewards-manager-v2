
import React, { useState } from 'react';

export default function App() {
  const [points, setPoints] = useState(420);
  const [level, setLevel] = useState(2);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center bg-gradient-to-br from-blue-50 to-gray-100">
      <h1 className="text-3xl font-bold mb-4">ZV Rewards Manager</h1>
      <p className="text-gray-600 mb-6">Prototipo en React + Vite + Tailwind</p>
      <div className="bg-white shadow rounded-2xl p-6 w-80">
        <div className="mb-4">
          <h2 className="font-semibold text-lg">Nivel actual</h2>
          <p className="text-2xl">{level}</p>
        </div>
        <div className="mb-4">
          <h2 className="font-semibold text-lg">Puntos</h2>
          <p className="text-2xl">{points}</p>
        </div>
        <button
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl"
          onClick={() => setPoints(points + 10)}
        >
          Sumar 10 puntos
        </button>
      </div>
    </div>
  );
}
