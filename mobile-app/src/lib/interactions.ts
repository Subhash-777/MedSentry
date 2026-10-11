import { supabase } from './supabase';

export interface InteractionResult {
  interacting_with: string;
  severity: string | null;
  description: string;
}

export async function checkInteractions(newDrugId: string, activeDrugIds: string[]): Promise<InteractionResult[]> {
  if (!activeDrugIds.length) return [];

  try {
    // Check both directions (A -> B and B -> A) since the relation is symmetric but stored directionally
    const { data: interactionsA, error: errA } = await supabase
      .from('drug_interactions')
      .select('severity, description, drug_b:drugs!drug_interactions_drug_b_id_fkey(name)')
      .eq('drug_a_id', newDrugId)
      .in('drug_b_id', activeDrugIds);

    const { data: interactionsB, error: errB } = await supabase
      .from('drug_interactions')
      .select('severity, description, drug_a:drugs!drug_interactions_drug_a_id_fkey(name)')
      .eq('drug_b_id', newDrugId)
      .in('drug_a_id', activeDrugIds);

    if (errA) throw errA;
    if (errB) throw errB;

    const results: InteractionResult[] = [];
    
    if (interactionsA) {
      interactionsA.forEach((i: any) => results.push({
        interacting_with: i.drug_b?.name || 'Unknown',
        severity: i.severity,
        description: i.description
      }));
    }
    
    if (interactionsB) {
      interactionsB.forEach((i: any) => results.push({
        interacting_with: i.drug_a?.name || 'Unknown',
        severity: i.severity,
        description: i.description
      }));
    }

    return results;
  } catch (err) {
    console.error('Check interactions error:', err);
    return [];
  }
}
