import type { HelpStep as HelpStepType } from "@/content/help/types";
import { HelpScreenshot } from "./HelpScreenshot";
import styles from "./help.module.scss";

interface HelpStepProps {
  step: HelpStepType;
  index: number;
  isLast: boolean;
}

export function HelpStep({ step, index, isLast }: HelpStepProps) {
  return (
    <div className={styles.stepItem}>
      <div className={styles.stepLine}>
        <div className={styles.stepNum}>{index + 1}</div>
        {!isLast && <div className={styles.stepConnector} />}
      </div>

      <div className={styles.stepContent}>
        <h3 className={styles.stepHeading}>{step.heading}</h3>
        <p className={styles.stepBody}>{step.body}</p>

        {step.tip && <div className={styles.stepTip}>{step.tip}</div>}
        {step.warning && (
          <div className={styles.stepWarning}>{step.warning}</div>
        )}
        {step.screenshot && (
          <HelpScreenshot filename={step.screenshot} alt={step.heading} />
        )}
      </div>
    </div>
  );
}
