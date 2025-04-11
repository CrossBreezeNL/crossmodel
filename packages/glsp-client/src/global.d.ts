/********************************************************************************
 * Copyright (c) 2025 EclipseSource and others.
 *
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License v. 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0.
 *
 * This Source Code may also be made available under the following Secondary
 * Licenses when the conditions for such availability set forth in the Eclipse
 * Public License v. 2.0 are satisfied:
 * -- GNU General Public License, version 2 with the GNU Classpath Exception
 * which is available at https://www.gnu.org/software/classpath/license.html
 * -- MIT License which is available at https://opensource.org/license/mit.
 *
 * SPDX-License-Identifier: EPL-2.0 OR GPL-2.0 WITH Classpath-exception-2.0 OR MIT
 ********************************************************************************/
import { VNodeData } from 'snabbdom';

/**
 * Prevents TypeScript from throwing an error when using JSX in TypeScript files.
 * Use the correct JSX types for the Sprotty SVG rendering.
 *
 * @see https://www.typescriptlang.org/tsconfig/#jsxFactory
 */
declare global {
   /********************************************************************************
    * Copyright (c) 2017-2021 TypeFox and others.
    *
    * This program and the accompanying materials are made available under the
    * terms of the Eclipse Public License v. 2.0 which is available at
    * http://www.eclipse.org/legal/epl-2.0.
    *
    * This Source Code may also be made available under the following Secondary
    * Licenses when the conditions for such availability set forth in the Eclipse
    * Public License v. 2.0 are satisfied: GNU General Public License, version 2
    * with the GNU Classpath Exception which is available at
    * https://www.gnu.org/software/classpath/license.html.
    *
    * SPDX-License-Identifier: EPL-2.0 OR GPL-2.0 WITH Classpath-exception-2.0
    ********************************************************************************/
   // https://github.com/eclipse-sprotty/sprotty/blob/master/packages/sprotty/src/lib/jsx.ts
   // eslint-disable-next-line no-redeclare
   namespace svg.JSX {
      // Based on the tag list in github:DefinitelyTyped/DefinitelyTyped:React
      interface IntrinsicElements {
         [elemName: string]: VNodeData;
      }
   }
}
