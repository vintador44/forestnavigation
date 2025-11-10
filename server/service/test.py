import math
import random
from typing import List, Tuple

def generate_test_tracks() -> List[List[Tuple[float, float, float]]]:
    """
    Генерирует тестовые треки разных типов для проверки
    """
    tracks = []
    
    # 1. ГОРИЗОНТАЛЬНЫЙ ТРЕК (равнина)
    track_flat = []
    base_lat, base_lon = 55.7558, 37.6176  # Москва
    for i in range(100):
        lat = base_lat + i * 0.001  # ~111 м шаг
        lon = base_lon + i * 0.001
        height = 150.0 + random.uniform(-5, 5)  # небольшие колебания
        track_flat.append((lat, lon, height))
    tracks.append(("Горизонтальный трек (равнина)", track_flat))
    
    # 2. ВЕРТИКАЛЬНЫЙ ПОДЪЁМ (горный склон)
    track_mountain = []
    base_lat, base_lon = 43.5994, 42.9342  # Эльбрус регион
    for i in range(50):
        lat = base_lat + i * 0.002
        lon = base_lon
        height = 2000.0 + i * 40.0  # подъём 40м на точку
        track_mountain.append((lat, lon, height))
    tracks.append(("Вертикальный подъём (горы)", track_mountain))
    
    # 3. СЕРПАНТИН (извилистая дорога)
    track_serpentine = []
    base_lat, base_lon = 44.6333, 33.5333  # Крым
    for i in range(200):
        lat = base_lat + math.sin(i * 0.1) * 0.005
        lon = base_lon + i * 0.001
        height = 500.0 + i * 2.0 + math.sin(i * 0.3) * 50.0
        track_serpentine.append((lat, lon, height))
    tracks.append(("Серпантин", track_serpentine))
    
    # 4. КРУГОВОЙ МАРШРУТ
    track_circle = []
    center_lat, center_lon = 55.7558, 37.6176
    radius_deg = 0.01  # ~1.1 км радиус
    for angle in range(0, 360, 10):
        rad = math.radians(angle)
        lat = center_lat + radius_deg * math.cos(rad)
        lon = center_lon + radius_deg * math.sin(rad)
        height = 150.0 + math.sin(rad * 3) * 20.0  + random.uniform(-2, 2)
        track_circle.append((lat, lon, height))
    tracks.append(("Круговой маршрут", track_circle))
    
    # 5. СЛУЧАЙНЫЙ ТРЕК
    track_random = []
    base_lat, base_lon = 59.9343, 30.3351  # Санкт-Петербург
    current_lat, current_lon = base_lat, base_lon
    current_height = 10.0
    
    for i in range(300):
        # Случайное блуждание
        current_lat += random.uniform(-0.001, 0.001)
        current_lon += random.uniform(-0.001, 0.001)
        current_height += random.uniform(-10, 10)
        current_height = max(0, current_height)  # не ниже уровня моря
        
        track_random.append((current_lat, current_lon, current_height))
    tracks.append(("Случайный трек", track_random))
    
    # 6. ДЛИННЫЙ МАРШРУТ (Москва-СПб)
    track_long = []
    moscow = (55.7558, 37.6176, 150.0)
    spb = (59.9343, 30.3351, 10.0)
    
    steps = 500
    for i in range(steps):
        t = i / (steps - 1)
        lat = moscow[0] + (spb[0] - moscow[0]) * t
        lon = moscow[1] + (spb[1] - moscow[1]) * t
        height = moscow[2] + (spb[2] - moscow[2]) * t + math.sin(t * 10) * 50
        track_long.append((lat, lon, height))
    tracks.append(("Длинный маршрут Москва-СПб", track_long))
    
    return tracks

def calculate_angle_3d(
    point1: Tuple[float, float, float],
    point2: Tuple[float, float, float],
    R: float = 6371000.0,
) -> Tuple[float, float]:
    """
    Вычисляет углы между двумя точками в 3D-пространстве с учётом высоты.
    """
    lat1, lon1, h1 = point1
    lat2, lon2, h2 = point2

    # Преобразование в радианы
    φ1 = math.radians(lat1)
    φ2 = math.radians(lat2)
    Δφ = φ2 - φ1
    Δλ = math.radians(lon2 - lon1)

    # Вычисление горизонтального расстояния (формула гаверсинуса)
    sin_Δφ2 = math.sin(Δφ * 0.5)
    sin_Δλ2 = math.sin(Δλ * 0.5)
    a = sin_Δφ2 * sin_Δφ2 + math.cos(φ1) * math.cos(φ2) * sin_Δλ2 * sin_Δλ2
    
    if a > 1:
        a = 1.0
    elif a < 0:
        a = 0.0

    Δσ = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    R_eff = R + 0.5 * (h1 + h2)
    d_horiz = R_eff * Δσ
    
    # Вычисление вертикального изменения
    Δh = h2 - h1
    
    # Угол между точками (центральный угол сферы)
    angle_between_points = Δσ
    
    # Угол наклона (вертикальный угол)
    if d_horiz == 0:
        angle_inclination = math.copysign(math.pi / 2, Δh)  # ±90° если горизонтальное расстояние 0
    else:
        angle_inclination = math.atan2(Δh, d_horiz)
    
    return angle_between_points, angle_inclination

def track_distance_3d(
    track: List[Tuple[float, float, float]],
    R: float = 6371000.0,
) -> float:
    """
    Вычисляет длину 3D-траектории (трека) с учётом высоты.
    """
    if len(track) < 2:
        return 0.0

    total = 0.0
    for i in range(len(track) - 1):
        lat1, lon1, h1 = track[i]
        lat2, lon2, h2 = track[i + 1]

        φ1 = math.radians(lat1)
        φ2 = math.radians(lat2)
        Δφ = φ2 - φ1
        Δλ = math.radians(lon2 - lon1)

        sin_Δφ2 = math.sin(Δφ * 0.5)
        sin_Δλ2 = math.sin(Δλ * 0.5)
        a = sin_Δφ2 * sin_Δφ2 + math.cos(φ1) * math.cos(φ2) * sin_Δλ2 * sin_Δλ2

        if a > 1:
            a = 1.0
        elif a < 0:
            a = 0.0

        Δσ = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
        R_eff = R + 0.5 * (h1 + h2)
        d_horiz = R_eff * Δσ
        Δh = h2 - h1
        segment = math.sqrt(d_horiz * d_horiz + Δh * Δh)
        total += segment

    return total

def calculate_angle_3d_degrees(
    point1: Tuple[float, float, float],
    point2: Tuple[float, float, float],
    R: float = 6371000.0,
) -> Tuple[float, float]:
    """
    Вычисляет углы между двумя точками в 3D-пространстве и возвращает в градусах.
    """
    angle_between, inclination = calculate_angle_3d(point1, point2, R)
    return math.degrees(angle_between), math.degrees(inclination)

def climbing_difficulty(angle_deg: float) -> float:
    """
    Сложность подъёма в зависимости от угла (на основе энергозатрат Minetti)
    """
    return 1.0 + 0.092 * angle_deg + 0.00023 * angle_deg**2 + 0.0000075 * angle_deg**3

def descending_difficulty(angle_deg: float) -> float:
    """
    Сложность спуска в зависимости от угла
    """
    angle_abs = abs(angle_deg)
    if angle_abs <= 10:
        return 1.0 - 0.05 * angle_abs
    else:
        return 0.5 + 0.03 * (angle_abs - 10)

def calculate_cumulative_difficulty(
    track: List[Tuple[float, float, float]],
    R: float = 6371000.0,
) -> float:
    """
    Вычисляет накопительную сложность маршрута на основе энергозатрат.
    Возвращает сложность в условных единицах (чем больше - тем сложнее).
    """
    if len(track) < 2:
        return 0.0

    total_difficulty = 0.0
    
    for i in range(len(track) - 1):
        point1, point2 = track[i], track[i + 1]
        
        # Вычисляем горизонтальное расстояние и угол
        angle_between, inclination_rad = calculate_angle_3d(point1, point2, R)
        d_horiz = (R + 0.5 * (point1[2] + point2[2])) * angle_between
        inclination_deg = math.degrees(inclination_rad)
        Δh = point2[2] - point1[2]
        
        # Определяем сложность сегмента
        if Δh > 0:  # подъём
            multiplier = climbing_difficulty(inclination_deg)
        else:       # спуск
            multiplier = descending_difficulty(inclination_deg)
        
        # Сложность сегмента = горизонтальное расстояние × множитель сложности
        segment_difficulty = d_horiz * multiplier
        total_difficulty += segment_difficulty
    
    return total_difficulty

def test_functions_correctness():
    """Тестирует корректность работы функций на простых случаях"""
    print("\n" + "="*70)
    print("ТЕСТИРОВАНИЕ КОРРЕКТНОСТИ ФУНКЦИЙ")
    print("="*70)
    
    # ТЕСТ 1: Точки на одной высоте, небольшое расстояние
    print("\n1. ТЕСТ: Точки на одной высоте (10м), расстояние ~111м")
    point1 = (55.7558, 37.6173, 10.0)
    point2 = (55.7568, 37.6173, 10.0)  # 0.001° по широте ≈ 111м
    
    angle_rad, slope_rad = calculate_angle_3d(point1, point2)
    angle_deg, slope_deg = calculate_angle_3d_degrees(point1, point2)
    distance = track_distance_3d([point1, point2])
    difficulty = calculate_cumulative_difficulty([point1, point2])
    
    print(f"   Угол между точками: {angle_deg:.6f}°")
    print(f"   Угол наклона: {slope_deg:.6f}° (должен быть ~0°)")
    print(f"   Расстояние: {distance:.2f} м (должно быть ~111м)")
    print(f"   Сложность: {difficulty:.2f} ед.")
    
    # ТЕСТ 2: Вертикальный подъем
    print("\n2. ТЕСТ: Вертикальный подъем (только высота)")
    point1 = (55.7558, 37.6173, 0.0)
    point2 = (55.7558, 37.6173, 100.0)  # Только высота меняется
    
    angle_rad, slope_rad = calculate_angle_3d(point1, point2)
    angle_deg, slope_deg = calculate_angle_3d_degrees(point1, point2)
    distance = track_distance_3d([point1, point2])
    difficulty = calculate_cumulative_difficulty([point1, point2])
    
    print(f"   Угол между точками: {angle_deg:.6f}° (должен быть 0°)")
    print(f"   Угол наклона: {slope_deg:.6f}° (должен быть 90°)")
    print(f"   Расстояние: {distance:.2f} м (должно быть 100м)")
    print(f"   Сложность: {difficulty:.2f} ед.")
    
    # ТЕСТ 3: Наклон 45 градусов
    print("\n3. ТЕСТ: Наклон 45 градусов")
    point1 = (55.7558, 37.6173, 0.0)
    point2 = (55.7568, 37.6173, 111.0)  # 111м по горизонтали, 111м по вертикали
    
    angle_rad, slope_rad = calculate_angle_3d(point1, point2)
    angle_deg, slope_deg = calculate_angle_3d_degrees(point1, point2)
    distance = track_distance_3d([point1, point2])
    difficulty = calculate_cumulative_difficulty([point1, point2])
    expected_distance = math.sqrt(111**2 + 111**2)
    
    print(f"   Угол между точками: {angle_deg:.6f}°")
    print(f"   Угол наклона: {slope_deg:.2f}° (должен быть ~45°)")
    print(f"   Расстояние: {distance:.2f} м")
    print(f"   Ожидаемое расстояние: {expected_distance:.2f} м")
    print(f"   Сложность: {difficulty:.2f} ед.")
    print(f"   Множитель сложности для 45°: {climbing_difficulty(45.0):.2f}×")
    
    # ТЕСТ 4: Разные углы для демонстрации
    print("\n4. ТЕСТ: Демонстрация сложности для разных углов")
    test_angles = [0, 10, 20, 30, 45, 60]
    for angle in test_angles:
        point1 = (55.7558, 37.6173, 0.0)
        # Создаем точку с заданным углом наклона (100м горизонтали)
        d_horiz = 100.0
        Δh = d_horiz * math.tan(math.radians(angle))
        point2 = (55.7568, 37.6173, Δh)
        
        difficulty = calculate_cumulative_difficulty([point1, point2])
        multiplier = climbing_difficulty(angle) if angle >= 0 else descending_difficulty(angle)
        
        print(f"   Уклон {angle:2d}°: сложность = {difficulty:6.1f} ед. (множитель {multiplier:.2f}×)")

def analyze_track(track_name: str, track: List[Tuple[float, float, float]]):
    """Анализирует трек и проверяет корректность работы функций"""
    print(f"\n{'='*60}")
    print(f"ТРЕК: {track_name}")
    print(f"{'='*60}")
    
    print(f"Количество точек: {len(track)}")
    
    # Базовая статистика
    heights = [point[2] for point in track]
    min_h, max_h = min(heights), max(heights)
    avg_h = sum(heights) / len(heights)
    print(f"Высота: мин={min_h:.1f}м, макс={max_h:.1f}м, средняя={avg_h:.1f}м")
    
    # Расстояния и сложность
    distance_3d = track_distance_3d(track)
    distance_2d = track_distance_3d([(lat, lon, 0) for lat, lon, h in track])
    total_difficulty = calculate_cumulative_difficulty(track)
    
    print(f"3D расстояние: {distance_3d:,.0f} м")
    print(f"2D расстояние: {distance_2d:,.0f} м") 
    print(f"Общая сложность: {total_difficulty:,.0f} ед.")
    print(f"Относительная сложность: {total_difficulty/distance_3d:.2f} ед/м")
    
    # Анализ углов и сложности
    if len(track) > 1:
        slopes = []
        difficulties = []
        
        for i in range(len(track) - 1):
            angle_between, slope = calculate_angle_3d(track[i], track[i + 1])
            slope_deg = math.degrees(slope)
            slopes.append(slope_deg)
            
            # Сложность отдельного сегмента
            seg_track = [track[i], track[i + 1]]
            seg_difficulty = calculate_cumulative_difficulty(seg_track)
            difficulties.append(seg_difficulty)
        
        avg_slope = sum(slopes) / len(slopes)
        max_slope = max(slopes, key=abs)
        avg_difficulty = sum(difficulties) / len(difficulties)
        max_difficulty = max(difficulties)
        
        print(f"Средний уклон: {avg_slope:.2f}°")
        print(f"Максимальный уклон: {max_slope:.2f}°")
        print(f"Средняя сложность сегмента: {avg_difficulty:.1f} ед.")
        print(f"Максимальная сложность сегмента: {max_difficulty:.1f} ед.")
        
        # Классификация сложности маршрута
        relative_difficulty = total_difficulty / distance_3d
        if relative_difficulty < 1.1:
            difficulty_class = "Лёгкий"
        elif relative_difficulty < 1.5:
            difficulty_class = "Средний"
        elif relative_difficulty < 2.0:
            difficulty_class = "Сложный"
        else:
            difficulty_class = "Эксперт"
        
        print(f"Класс сложности: {difficulty_class}")

if __name__ == "__main__":
    print("ТЕСТИРОВАНИЕ РАБОТЫ ФУНКЦИЙ 3D РАССТОЯНИЙ И СЛОЖНОСТИ")
    print("=" * 60)
    
    # Сначала тестируем на простых случаях
    test_functions_correctness()
    
    # Затем анализируем сложные треки
    print("\n\n" + "="*70)
    print("АНАЛИЗ СЛОЖНЫХ ТРАЕКТОРИЙ")
    print("="*70)
    
    test_tracks = generate_test_tracks()
    
    for track_name, track in test_tracks:
        analyze_track(track_name, track)
    
    print(f"\n\nТестирование завершено!")