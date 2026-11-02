import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Svg, { Line, Rect, Text as SvgText } from 'react-native-svg';

import { ThemedText } from '@/components/themed-text';
import { FontFamily } from '@/constants/theme';
import { useSeriesColor, useTheme } from '@/hooks/use-theme';
import type { SeriesPoint } from '@/utils/analyse';

type AnalyseChartProps = {
  points: SeriesPoint[];
  format: (value: number) => string;
  showAverage: boolean;
  compare: boolean;
  stacked: boolean;
  /** Bar selected before the user taps one (e.g. the latest period). */
  defaultSelected: number;
  height?: number;
};

const LABEL_SPACE = 18;
const MAX_LABELS = 7;
const SEGMENT_GAP = 2;

/** Column chart for the Analyse playground. Supports negative values (net), stacks and comparisons. */
export function AnalyseChart({
  points,
  format,
  showAverage,
  compare,
  stacked,
  defaultSelected,
  height = 150,
}: AnalyseChartProps) {
  const theme = useTheme();
  const seriesColor = useSeriesColor();
  const [width, setWidth] = useState(0);
  const [picked, setPicked] = useState<{ key: string } | null>(null);

  const pickedIndex = picked ? points.findIndex((p) => p.key === picked.key) : -1;
  const selected = pickedIndex >= 0 ? pickedIndex : defaultSelected;
  const values = points.flatMap((p) => (compare ? [p.value, p.previous] : [p.value]));
  const max = Math.max(1, ...values);
  const min = Math.min(0, ...values);
  const plot = height - LABEL_SPACE;
  const zeroY = (max / (max - min)) * plot;
  const y = (value: number) => zeroY - (value / (max - min)) * plot;
  const average = points.length > 0 ? points.reduce((sum, p) => sum + p.value, 0) / points.length : 0;

  const band = points.length > 0 ? width / points.length : 0;
  const barWidth = compare
    ? Math.max(1.5, Math.min(14, (band * 0.8) / 2 - 1))
    : Math.max(2, Math.min(17, band * 0.72));
  const radius = Math.min(5, barWidth / 2);
  const labelEvery = Math.max(1, Math.ceil(points.length / MAX_LABELS));
  const active = points[selected];

  const bar = (key: string, x: number, value: number, fill: string, opacity = 1) => {
    if (value === 0) return null;
    const top = Math.min(y(value), zeroY);
    const h = Math.max(2, Math.abs(y(value) - zeroY));
    return <Rect key={key} x={x} y={top} width={barWidth} height={h} rx={radius} fill={fill} opacity={opacity} />;
  };

  return (
    <View style={styles.container}>
      <View style={styles.readout}>
        {active && (
          <ThemedText type="caption" themeColor="textSecondary" numberOfLines={1}>
            <ThemedText type="smallBold">{active.title}</ThemedText>
            {'  '}
            {format(active.value)}
            {compare ? `   previous ${format(active.previous)}` : ''}
          </ThemedText>
        )}
      </View>

      <View style={{ height }} onLayout={(event) => setWidth(event.nativeEvent.layout.width)}>
        {width > 0 && (
          <Svg width={width} height={height}>
            {points.map((point, index) => {
              const center = band * index + band / 2;
              const isSelected = index === selected;
              const x = compare ? center + 1 : center - barWidth / 2;
              const marks = [];
              if (compare) {
                marks.push(bar(`${point.key}-prev`, center - 1 - barWidth, point.previous, theme.backgroundSelected));
              }
              if (stacked && point.segments.length > 0) {
                // Stack from the baseline up, largest category at the bottom, with a 2px gap between segments.
                const offsets = point.segments.reduce<number[]>((acc, segment, i) => [...acc, acc[i] + segment.value], [0]);
                point.segments.forEach((segment, s) => {
                  const bottom = y(offsets[s]);
                  const top = y(offsets[s + 1]);
                  const h = bottom - top - (s > 0 ? SEGMENT_GAP : 0);
                  if (h > 0) {
                    marks.push(
                      <Rect
                        key={`${point.key}-${segment.key}`}
                        x={x}
                        y={top}
                        width={barWidth}
                        height={h}
                        rx={Math.min(radius, h / 2)}
                        fill={seriesColor(segment.color)}
                        opacity={isSelected ? 1 : 0.55}
                      />
                    );
                  }
                });
              } else {
                marks.push(bar(`${point.key}-cur`, x, point.value, isSelected ? theme.primary : theme.muted));
              }
              return marks;
            })}

            <Line x1={0} x2={width} y1={zeroY} y2={zeroY} stroke={theme.border} strokeWidth={1} />

            {showAverage && average !== 0 && (
              <>
                <Line
                  x1={0}
                  x2={width}
                  y1={y(average)}
                  y2={y(average)}
                  stroke={theme.text}
                  strokeWidth={1.5}
                  strokeDasharray="4 4"
                  opacity={0.6}
                />
                <SvgText
                  x={width - 2}
                  y={y(average) - 5}
                  fontSize={10}
                  fontFamily={FontFamily.bodySemiBold}
                  fill={theme.textSecondary}
                  textAnchor="end">
                  avg
                </SvgText>
              </>
            )}

            {points.map((point, index) =>
              index % labelEvery === 0 || index === points.length - 1 ? (
                <SvgText
                  key={`label-${point.key}`}
                  x={band * index + band / 2}
                  y={height - 3}
                  fontSize={10}
                  fontFamily={FontFamily.bodyMedium}
                  fill={index === selected ? theme.text : theme.textTertiary}
                  textAnchor="middle">
                  {point.label}
                </SvgText>
              ) : null
            )}
          </Svg>
        )}
        {/* Hit targets span the whole band, wider than the bars. */}
        <View style={[StyleSheet.absoluteFill, styles.hitRow]}>
          {points.map((point) => (
            <Pressable
              key={point.key}
              accessibilityRole="button"
              accessibilityLabel={`${point.title}: ${format(point.value)}`}
              style={styles.hit}
              onPress={() => setPicked({ key: point.key })}
            />
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 6,
  },
  readout: {
    height: 18,
    justifyContent: 'center',
  },
  hitRow: {
    flexDirection: 'row',
  },
  hit: {
    flex: 1,
  },
});
