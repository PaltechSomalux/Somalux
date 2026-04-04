/**
 * SupabaseCallService.js
 * 
 * Supabase integration for voice/video call signaling
 * Replaces Firebase Firestore call operations with Supabase PostgreSQL
 */

import { supabase } from '../../supabase';

class SupabaseCallServiceClass {
  constructor() {
    this.unsubscribers = new Map();
  }

  /**
   * Initiate a new call
   */
  async initiateCall(callId, initiatorId, participants, callType = 'audio') {
    try {
      const { data: call, error: callError } = await supabase
        .from('calls')
        .insert({
          call_id: callId,
          initiator_id: initiatorId,
          status: 'pending',
          call_type: callType,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (callError) {
        console.error('Failed to create call:', callError);
        throw callError;
      }

      // Add participants
      const participantInserts = participants.map((userId) => ({
        call_id: call.id,
        user_id: userId,
        joined_at: new Date().toISOString(),
      }));

      const { error: participantsError } = await supabase
        .from('call_participants')
        .insert(participantInserts);

      if (participantsError) {
        console.error('Failed to add call participants:', participantsError);
        throw participantsError;
      }

      return call;
    } catch (error) {
      console.error('initiateCall error:', error);
      throw error;
    }
  }

  /**
   * Update call status
   */
  async updateCallStatus(callId, status) {
    try {
      const updateData = { status };

      if (status === 'active') {
        updateData.started_at = new Date().toISOString();
      } else if (status === 'ended') {
        updateData.ended_at = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from('calls')
        .update(updateData)
        .eq('call_id', callId)
        .select()
        .single();

      if (error) {
        console.error('Failed to update call status:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('updateCallStatus error:', error);
      throw error;
    }
  }

  /**
   * Send WebRTC signal (offer, answer, candidate)
   */
  async sendSignal(callId, senderId, signalType, signalData) {
    try {
      // Get call by call_id
      const { data: call } = await supabase
        .from('calls')
        .select('id')
        .eq('call_id', callId)
        .single();

      const { data: signal, error } = await supabase
        .from('call_signals')
        .insert({
          call_id: call.id,
          signal_type: signalType,
          sender_id: senderId,
          signal_data: signalData,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        console.error('Failed to send signal:', error);
        throw error;
      }

      return signal;
    } catch (error) {
      console.error('sendSignal error:', error);
      throw error;
    }
  }

  /**
   * Fetch signals for a call
   */
  async fetchCallSignals(callId) {
    try {
      // Get call by call_id
      const { data: call } = await supabase
        .from('calls')
        .select('id')
        .eq('call_id', callId)
        .single();

      const { data: signals, error } = await supabase
        .from('call_signals')
        .select('*')
        .eq('call_id', call.id)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Failed to fetch call signals:', error);
        throw error;
      }

      return signals || [];
    } catch (error) {
      console.error('fetchCallSignals error:', error);
      throw error;
    }
  }

  /**
   * Subscribe to call signals (real-time)
   */
  subscribeToCallSignals(callId, onSignal) {
    try {
      const subscription = supabase
        .from(`call_signals:calls.call_id=eq.${callId}`)
        .on('INSERT', (payload) => {
          if (onSignal) {
            onSignal({ type: 'signal', data: payload.new });
          }
        })
        .subscribe();

      const subscriptionId = `call_signals_${callId}_${Date.now()}`;
      this.unsubscribers.set(subscriptionId, () => subscription.unsubscribe());

      return subscriptionId;
    } catch (error) {
      console.error('subscribeToCallSignals error:', error);
      return null;
    }
  }

  /**
   * Subscribe to call status changes
   */
  subscribeToCallStatus(callId, onStatusChange) {
    try {
      const subscription = supabase
        .from(`calls:call_id=eq.${callId}`)
        .on('UPDATE', (payload) => {
          if (onStatusChange) {
            onStatusChange({ status: payload.new.status, call: payload.new });
          }
        })
        .subscribe();

      const subscriptionId = `call_status_${callId}_${Date.now()}`;
      this.unsubscribers.set(subscriptionId, () => subscription.unsubscribe());

      return subscriptionId;
    } catch (error) {
      console.error('subscribeToCallStatus error:', error);
      return null;
    }
  }

  /**
   * Record participant as joined
   */
  async recordParticipantJoined(callId, userId) {
    try {
      // Get call by call_id
      const { data: call } = await supabase
        .from('calls')
        .select('id')
        .eq('call_id', callId)
        .single();

      const { data, error } = await supabase
        .from('call_participants')
        .update({ joined_at: new Date().toISOString() })
        .eq('call_id', call.id)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        console.error('Failed to record participant join:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('recordParticipantJoined error:', error);
      throw error;
    }
  }

  /**
   * Record participant as left
   */
  async recordParticipantLeft(callId, userId) {
    try {
      // Get call by call_id
      const { data: call } = await supabase
        .from('calls')
        .select('id')
        .eq('call_id', callId)
        .single();

      const { data, error } = await supabase
        .from('call_participants')
        .update({ left_at: new Date().toISOString() })
        .eq('call_id', call.id)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        console.error('Failed to record participant leave:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('recordParticipantLeft error:', error);
      throw error;
    }
  }

  /**
   * Get call details with participants
   */
  async getCallDetails(callId) {
    try {
      const { data: call, error: callError } = await supabase
        .from('calls')
        .select('*')
        .eq('call_id', callId)
        .single();

      if (callError) {
        throw callError;
      }

      const { data: participants, error: participantsError } = await supabase
        .from('call_participants')
        .select('user_id, users(*)')
        .eq('call_id', call.id);

      if (participantsError) {
        throw participantsError;
      }

      return {
        ...call,
        participants: participants?.map((p) => p.users) || [],
      };
    } catch (error) {
      console.error('getCallDetails error:', error);
      throw error;
    }
  }

  /**
   * End call and clean up
   */
  async endCall(callId) {
    try {
      const now = new Date().toISOString();
      
      const { data: call } = await supabase
        .from('calls')
        .select('id, started_at')
        .eq('call_id', callId)
        .single();

      // Calculate duration
      let durationSeconds = 0;
      if (call.started_at) {
        durationSeconds = Math.floor((new Date() - new Date(call.started_at)) / 1000);
      }

      const { data, error } = await supabase
        .from('calls')
        .update({
          status: 'ended',
          ended_at: now,
          duration_seconds: durationSeconds,
        })
        .eq('call_id', callId)
        .select()
        .single();

      if (error) {
        console.error('Failed to end call:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('endCall error:', error);
      throw error;
    }
  }

  /**
   * Unsubscribe from a subscription
   */
  unsubscribe(subscriptionId) {
    const unsubscribe = this.unsubscribers.get(subscriptionId);
    if (unsubscribe) {
      unsubscribe();
      this.unsubscribers.delete(subscriptionId);
    }
  }

  /**
   * Unsubscribe all
   */
  unsubscribeAll() {
    this.unsubscribers.forEach((unsubscribe) => {
      try {
        unsubscribe();
      } catch (error) {
        console.error('Error unsubscribing:', error);
      }
    });
    this.unsubscribers.clear();
  }
}

export const SupabaseCallService = new SupabaseCallServiceClass();
