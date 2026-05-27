import React, { useState } from 'react';

const StealthDisguise = ({ onUnlock }) => {
  const [calcDisplay, setCalcDisplay] = useState('0');
  const [prevValue, setPrevValue] = useState(null);
  const [operation, setOperation] = useState(null);
  const [clearOnNext, setClearOnNext] = useState(false);

  const handleDigit = (digit) => {
    if (calcDisplay === '0' || clearOnNext) {
      setCalcDisplay(digit);
      setClearOnNext(false);
    } else {
      setCalcDisplay(prev => prev + digit);
    }
  };

  const handleOperator = (op) => {
    setPrevValue(parseFloat(calcDisplay));
    setOperation(op);
    setClearOnNext(true);
  };

  const handleClear = () => {
    setCalcDisplay('0');
    setPrevValue(null);
    setOperation(null);
  };

  const handleEquals = () => {
    // Secret unlock code check!
    if (calcDisplay === '9999') {
      onUnlock();
      return;
    }

    if (!operation || prevValue === null) return;
    
    const current = parseFloat(calcDisplay);
    let result = 0;
    
    switch (operation) {
      case '+': result = prevValue + current; break;
      case '-': result = prevValue - current; break;
      case '*': result = prevValue * current; break;
      case '/': result = prevValue / current; break;
      default: return;
    }
    
    setCalcDisplay(result.toString());
    setPrevValue(null);
    setOperation(null);
    setClearOnNext(true);
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      background: '#1c1c1e',
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '360px',
        background: 'black',
        borderRadius: '24px',
        padding: '20px',
        boxShadow: '0 10px 40px rgba(0,0,0,0.8)',
        border: '1px solid #2c2c2e'
      }}>
        
        {/* Calculator Header text */}
        <div style={{ color: '#48484a', fontSize: '0.8rem', textAlign: 'right', marginBottom: '8px', fontFamily: 'monospace' }}>
          Stealth Monitoring Active...
        </div>

        {/* Display Screen */}
        <div style={{
          color: 'white',
          fontSize: '3.6rem',
          textAlign: 'right',
          padding: '20px 10px',
          fontFamily: 'system-ui, -apple-system',
          fontWeight: '300',
          overflowX: 'auto',
          whiteSpace: 'nowrap',
          minHeight: '110px'
        }}>
          {calcDisplay}
        </div>

        {/* Calculator Button Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '12px',
          marginTop: '10px'
        }}>
          {/* Row 1 */}
          <button onClick={handleClear} style={calcBtnStyle('#a5a5a5', 'black')}>AC</button>
          <button style={calcBtnStyle('#a5a5a5', 'black')}>+/-</button>
          <button style={calcBtnStyle('#a5a5a5', 'black')}>%</button>
          <button onClick={() => handleOperator('/')} style={calcBtnStyle('#ff9f0a', 'white')}>÷</button>

          {/* Row 2 */}
          <button onClick={() => handleDigit('7')} style={calcBtnStyle('#333333', 'white')}>7</button>
          <button onClick={() => handleDigit('8')} style={calcBtnStyle('#333333', 'white')}>8</button>
          <button onClick={() => handleDigit('9')} style={calcBtnStyle('#333333', 'white')}>9</button>
          <button onClick={() => handleOperator('*')} style={calcBtnStyle('#ff9f0a', 'white')}>×</button>

          {/* Row 3 */}
          <button onClick={() => handleDigit('4')} style={calcBtnStyle('#333333', 'white')}>4</button>
          <button onClick={() => handleDigit('5')} style={calcBtnStyle('#333333', 'white')}>5</button>
          <button onClick={() => handleDigit('6')} style={calcBtnStyle('#333333', 'white')}>6</button>
          <button onClick={() => handleOperator('-')} style={calcBtnStyle('#ff9f0a', 'white')}>-</button>

          {/* Row 4 */}
          <button onClick={() => handleDigit('1')} style={calcBtnStyle('#333333', 'white')}>1</button>
          <button onClick={() => handleDigit('2')} style={calcBtnStyle('#333333', 'white')}>2</button>
          <button onClick={() => handleDigit('3')} style={calcBtnStyle('#333333', 'white')}>3</button>
          <button onClick={() => handleOperator('+')} style={calcBtnStyle('#ff9f0a', 'white')}>+</button>

          {/* Row 5 */}
          <button onClick={() => handleDigit('0')} style={{ ...calcBtnStyle('#333333', 'white'), gridColumn: 'span 2', borderRadius: '40px', textAlign: 'left', paddingLeft: '32px' }}>0</button>
          <button onClick={() => handleDigit('.')} style={calcBtnStyle('#333333', 'white')}>.</button>
          <button onClick={handleEquals} style={calcBtnStyle('#ff9f0a', 'white')}>=</button>
        </div>

        {/* Small tip at bottom */}
        <div style={{ color: '#48484a', fontSize: '0.78rem', textAlign: 'center', marginTop: '16px', fontStyle: 'italic' }}>
          Tip: Key passcode "9999" and hit "=" to return to Safety Vault
        </div>

      </div>
    </div>
  );
};

// Styling helper for iOS styled circular buttons
const calcBtnStyle = (bg, color) => ({
  background: bg,
  color: color,
  border: 'none',
  borderRadius: '50%',
  width: '100%',
  aspectRatio: '1',
  fontSize: '1.6rem',
  fontWeight: '500',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  outline: 'none',
  fontFamily: 'system-ui, -apple-system'
});

export default StealthDisguise;
