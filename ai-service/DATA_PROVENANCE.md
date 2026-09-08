# Data provenance

- Dataset A is user-supplied Survey of India village-boundary reference data. It is not used to train the delay model.
- Dataset B is `synthetic_acquisition_demo.csv`, a 2,500-row synthetic acquisition dataset used for development and demonstration.
- Future production training must use authorized historical acquisition data, versioned separately, with leakage review and operational validation.

The delay model excludes `delay_risk_score`, identifiers, and the synthetic note from its features. The dataset has only nine delayed records, so outputs are experimental decision support and probabilities are not calibrated.
