import React, { useCallback, useMemo, useState } from 'react';
</Pressable>
</View>
</View>
</Modal>
</KeyboardAvoidingView>
);
}


const styles = StyleSheet.create({
card: {
backgroundColor: 'rgba(255,255,255,0.06)',
borderRadius: 16,
padding: 14,
marginBottom: 12,
borderWidth: 1,
borderColor: 'rgba(255,255,255,0.08)',
},
label: { color: 'white', fontSize: 16, marginBottom: 8, fontWeight: '600' },
sub: { color: '#cbd5e1', fontSize: 12, marginTop: 6 },
input: {
backgroundColor: 'rgba(255,255,255,0.08)',
borderRadius: 12,
paddingHorizontal: 12,
paddingVertical: Platform.select({ ios: 12, android: 8 }),
color: 'white',
},
slider: { width: '100%', height: 36, marginTop: 4 },
row: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
primaryBtn: {
flexDirection: 'row',
alignItems: 'center',
backgroundColor: 'rgba(255,255,255,0.12)',
paddingHorizontal: 12,
paddingVertical: 10,
borderRadius: 12,
},
iconBtn: {
flexDirection: 'row',
alignItems: 'center',
paddingHorizontal: 10,
paddingVertical: 8,
borderRadius: 12,
backgroundColor: 'rgba(255,255,255,0.1)',
},
modalWrap: {
flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
alignItems: 'center', justifyContent: 'center',
padding: 16,
},
modalBody: {
backgroundColor: '#0b1220',
borderRadius: 16,
padding: 16,
width: '100%',
maxWidth: 420,
borderWidth: 1,
borderColor: 'rgba(255,255,255,0.08)',
},
modalTitle: { color: 'white', fontSize: 16, fontWeight: '700', marginBottom: 12 },
iconGrid: { flexDirection: 'row', flexWrap: 'wrap' },
iconCell: {
width: '25%', alignItems: 'center', marginBottom: 12, paddingVertical: 8,
borderRadius: 10,
},
});