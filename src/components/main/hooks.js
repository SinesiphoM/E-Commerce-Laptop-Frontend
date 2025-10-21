import { useEffect, useState, useCallback } from 'react';
import ApiService from '../../services/apiService';

export function useEscapeToClose(flags) {
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') flags.forEach(([cond, setter]) => cond && setter(false));
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [flags]);
}

export function useBodyScrollLock(anyModalOpen) {
  useEffect(() => {
    document.body.style.overflow = anyModalOpen ? 'hidden' : 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [anyModalOpen]);
}

export function useLaptops() {
  const [state, setState] = useState({ loading: false, error: '', data: [] });

  const load = useCallback(async () => {
    setState(s => ({ ...s, loading: true, error: '' }));
    try {
      const laptops = await ApiService.getLaptops();
      setState({ loading: false, error: '', data: laptops });
    } catch (err) {
      setState({ loading: false, error: ApiService.handleApiError(err), data: [] });
    }
  }, []);

  return { ...state, load };
}
