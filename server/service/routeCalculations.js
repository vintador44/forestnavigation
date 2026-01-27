
export const calculateAngle3D = (point1, point2, R = 6371000.0) => {
  const [lat1, lon1, h1] = point1;
  const [lat2, lon2, h2] = point2;


  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = φ2 - φ1;
  const Δλ = (lon2 - lon1) * Math.PI / 180;


  const sin_Δφ2 = Math.sin(Δφ * 0.5);
  const sin_Δλ2 = Math.sin(Δλ * 0.5);
  let a = sin_Δφ2 * sin_Δφ2 + Math.cos(φ1) * Math.cos(φ2) * sin_Δλ2 * sin_Δλ2;

  if (a > 1) a = 1.0;
  else if (a < 0) a = 0.0;

  const Δσ = 2.0 * Math.atan2(Math.sqrt(a), Math.sqrt(1.0 - a));
  const R_eff = R + 0.5 * (h1 + h2);
  const d_horiz = R_eff * Δσ;
  

  const Δh = h2 - h1;
  
 
  const angleBetweenPoints = Δσ;
  

  let angleInclination;
  if (d_horiz === 0) {
    angleInclination = Math.sign(Δh) * Math.PI / 2; 
  } else {
    angleInclination = Math.atan2(Δh, d_horiz);
  }
  
  return [angleBetweenPoints, angleInclination];
};


export const trackDistance3D = (track, R = 6371000.0) => {
  if (track.length < 2) return 0.0;

  let total = 0.0;
  for (let i = 0; i < track.length - 1; i++) {
    const [lat1, lon1, h1] = track[i];
    const [lat2, lon2, h2] = track[i + 1];

    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = φ2 - φ1;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const sin_Δφ2 = Math.sin(Δφ * 0.5);
    const sin_Δλ2 = Math.sin(Δλ * 0.5);
    let a = sin_Δφ2 * sin_Δφ2 + Math.cos(φ1) * Math.cos(φ2) * sin_Δλ2 * sin_Δλ2;

    if (a > 1) a = 1.0;
    else if (a < 0) a = 0.0;

    const Δσ = 2.0 * Math.atan2(Math.sqrt(a), Math.sqrt(1.0 - a));
    const R_eff = R + 0.5 * (h1 + h2);
    const d_horiz = R_eff * Δσ;
    const Δh = h2 - h1;
    const segment = Math.sqrt(d_horiz * d_horiz + Δh * Δh);
    total += segment;
  }

  return total;
};


export const calculateAngle3DDegrees = (point1, point2, R = 6371000.0) => {
  const [angleBetween, inclination] = calculateAngle3D(point1, point2, R);
  return [angleBetween * 180 / Math.PI, inclination * 180 / Math.PI];
};


export const climbingDifficulty = (angleDeg) => {
  return 1.0 + 0.092 * angleDeg + 0.00023 * angleDeg ** 2 + 0.0000075 * angleDeg ** 3;
};


export const descendingDifficulty = (angleDeg) => {
  const angleAbs = Math.abs(angleDeg);
  if (angleAbs <= 10) {
    return 1.0 - 0.05 * angleAbs;
  } else {
    return 0.5 + 0.03 * (angleAbs - 10);
  }
};


export const calculateCumulativeDifficulty = (track, R = 6371000.0) => {
  if (track.length < 2) return 0.0;

  let totalDifficulty = 0.0;
  
  for (let i = 0; i < track.length - 1; i++) {
    const point1 = track[i];
    const point2 = track[i + 1];
    

    const [angleBetween, inclinationRad] = calculateAngle3D(point1, point2, R);
    const d_horiz = (R + 0.5 * (point1[2] + point2[2])) * angleBetween;
    const inclinationDeg = inclinationRad * 180 / Math.PI;
    const Δh = point2[2] - point1[2];

    let multiplier;
    if (Δh > 0) { 
      multiplier = climbingDifficulty(inclinationDeg);
    } else {      
      multiplier = descendingDifficulty(inclinationDeg);
    }
    
   
    const segmentDifficulty = d_horiz * multiplier;
    totalDifficulty += segmentDifficulty;
  }
  
  return totalDifficulty;
};


export const classifyDifficulty = (totalDifficulty, distance3D) => {
  const relativeDifficulty = totalDifficulty / distance3D;
  
  if (relativeDifficulty < 1.1) return "Лёгкий";
  if (relativeDifficulty < 1.5) return "Средний";
  if (relativeDifficulty < 2.0) return "Сложный";
  return "Эксперт";
};


export const formatDistance = (meters) => {
  if (meters < 1000) {
    return `${Math.round(meters)} м`;
  } else {
    return `${(meters / 1000).toFixed(2)} км`;
  }
};


export const formatDifficulty = (difficulty) => {
  if (difficulty < 1000) {
    return `${Math.round(difficulty)} ед.`;
  } else if (difficulty < 1000000) {
    return `${(difficulty / 1000).toFixed(1)} тыс. ед.`;
  } else {
    return `${(difficulty / 1000000).toFixed(2)} млн ед.`;
  }
};